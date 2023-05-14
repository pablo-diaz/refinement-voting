using Microsoft.AspNetCore.Mvc;
using backend.Actors.Messages;
using backend.Controllers.DTOs;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VotingRoomController : ControllerBase
{
    private readonly ActorSystemConfiguration _actorSystemConfig;
    private readonly MemberStreamsConfiguration _memberStreamsConfiguration;

    public VotingRoomController(ActorSystemConfiguration withActorSystemConfig, MemberStreamsConfiguration memberStreamsConfiguration){
        this._actorSystemConfig = withActorSystemConfig;
        this._memberStreamsConfiguration = memberStreamsConfiguration;
    }

    [HttpGet]
    public String Get() => "Try using the post methods";

    [HttpPost("newRoom")]
    public IActionResult CreateVotingRoom([FromBody] CreateVotingRoomDTO request) {
        if(string.IsNullOrEmpty(request.LeaderName))
            return BadRequest("Please provide a valid leader name");

        var newVotingRoomMessage = new CreateVotingRoom(withLeaderName: request.LeaderName);
        _actorSystemConfig.ActorSystem.Root.Send(_actorSystemConfig.RoomsManagerActor, newVotingRoomMessage);

        var newMemberForLeaderMessage = new AddMemberToRoom(toRoomId: newVotingRoomMessage.Id, withMemberName: request.LeaderName);
        _actorSystemConfig.ActorSystem.Root.Send(_actorSystemConfig.RoomsManagerActor, newMemberForLeaderMessage);
        _memberStreamsConfiguration.AddMemberStream(toMemberId: newMemberForLeaderMessage.MemberId, withStream: newMemberForLeaderMessage.WithStream);

        return Ok(new { NewRoomId = newVotingRoomMessage.Id.ToString(), MemberIdForLeader = newMemberForLeaderMessage.MemberId.ToString() });
    }

    [HttpPost("newMember")]
    public IActionResult AddNewMemberToVotingRoom([FromBody] AddNewMemberToVotingRoomDTO request) {
        if(string.IsNullOrEmpty(request.ToRoomId) || Guid.TryParse(request.ToRoomId, out _) == false)
            return BadRequest("Please provide a valid room id");

        if(string.IsNullOrEmpty(request.MemberName))
            return BadRequest("Please provide a valid member name");

        var newMemberMessage = new AddMemberToRoom(toRoomId: Guid.Parse(request.ToRoomId), withMemberName: request.MemberName);
        _actorSystemConfig.ActorSystem.Root.Send(_actorSystemConfig.RoomsManagerActor, newMemberMessage);
        _memberStreamsConfiguration.AddMemberStream(toMemberId: newMemberMessage.MemberId, withStream: newMemberMessage.WithStream);

        return Ok(newMemberMessage.MemberId.ToString());
    }

    [HttpPost("room/{roomId}/member/{memberId}/getListOfMembers")]
    public IActionResult SendListOfAllMembersJoinedInRoom(string roomId, string memberId)
    {
        if(string.IsNullOrEmpty(roomId) || Guid.TryParse(roomId, out _) == false)
            return BadRequest("Please provide a valid room id");

        if(string.IsNullOrEmpty(memberId) || Guid.TryParse(memberId, out _) == false)
            return BadRequest("Please provide a valid member id");

        _actorSystemConfig.ActorSystem.Root.Send(_actorSystemConfig.RoomsManagerActor,
            new SendListOfAllMembersJoinedInRoom(inRoomId: Guid.Parse(roomId), toMemberId: Guid.Parse(memberId)));

        return Ok();
    }

    [HttpPost("room/{roomId}/newVotingSession")]
    public IActionResult StartNewVotingSessionInRoom(string roomId)
    {
        if(string.IsNullOrEmpty(roomId) || Guid.TryParse(roomId, out _) == false)
            return BadRequest("Please provide a valid room id");

        _actorSystemConfig.ActorSystem.Root.Send(_actorSystemConfig.RoomsManagerActor,
            new StartNewVotingSession(inRoomId: Guid.Parse(roomId)));

        return Ok();
    }

    [HttpPost("room/{roomId}/member/{memberId}/vote/{vote}")]
    public IActionResult Vote(string roomId, string memberId, short vote)
    {
        if(string.IsNullOrEmpty(roomId) || Guid.TryParse(roomId, out _) == false)
            return BadRequest("Please provide a valid room id");

        if(string.IsNullOrEmpty(memberId) || Guid.TryParse(memberId, out _) == false)
            return BadRequest("Please provide a valid member id");

        _actorSystemConfig.ActorSystem.Root.Send(_actorSystemConfig.RoomsManagerActor,
            new SubmitVote(inRoomId: Guid.Parse(roomId), byMemberId: Guid.Parse(memberId), submittedVote: vote));

        return Ok();
    }

    [HttpPost("room/{roomId}/revealResults")]
    public IActionResult RevealVotingResults(string roomId)
    {
        if(string.IsNullOrEmpty(roomId) || Guid.TryParse(roomId, out _) == false)
            return BadRequest("Please provide a valid room id");

        _actorSystemConfig.ActorSystem.Root.Send(_actorSystemConfig.RoomsManagerActor,
            new RevealVotingResults(inRoomId: Guid.Parse(roomId)));

        return Ok();
    }

    [HttpGet("member/{memberId}/stream")]
    public async Task GetStreamFromMember(string memberId, CancellationToken token){
        if(string.IsNullOrEmpty(memberId) || Guid.TryParse(memberId, out _) == false)
        {
            Console.WriteLine($"Error with non expected member Id '{memberId}' for Stream");
            return;
        }

        var maybeStreamFound = _memberStreamsConfiguration.TryGetMemberStream(Guid.Parse(memberId));
        if(maybeStreamFound.Found == false || maybeStreamFound.Stream == null)
        {
            Console.WriteLine($"Stream not found for member Id '{memberId}'");
            return;
        }

        Console.WriteLine($"Member Id '{memberId}' has joined to event stream");

        Response.Headers.Add("Content-Type", "text/event-stream");
        Response.Headers.Add("Cache-Control", "no-cache");
        Response.Headers.Add("Connection", "keep-alive");

        /*
        var messageQueue = new ConcurrentQueue<string>();
        maybeStreamFound.Stream.TryToSendMessage += message => messageQueue.Enqueue(message);

        while(token.IsCancellationRequested == false)
        {
            while(token.IsCancellationRequested == false && messageQueue.IsEmpty);

            if(messageQueue.TryDequeue(out string? messageToSend))
            {
                await Response.WriteAsync($"data: {messageToSend}\r\r");
                await Response.Body.FlushAsync();
            }
        }
        */

        var channel = System.Threading.Channels.Channel.CreateUnbounded<string>(
            new System.Threading.Channels.UnboundedChannelOptions() { SingleReader = true, SingleWriter = true }
        );

        maybeStreamFound.Stream.TryToSendMessage += message => channel.Writer.TryWrite(message);

        while(token.IsCancellationRequested == false)
        {
            Console.WriteLine($"Member Id '{memberId}': attempting to read messages from event stream");

            try
            {
                var messageToSend = await channel.Reader.ReadAsync(token);
                Console.WriteLine($"Member Id '{memberId}': message was read from event stream");
                if(string.IsNullOrEmpty(messageToSend) == false)
                {
                    await Response.WriteAsync($"data: {messageToSend}\r\r");
                    await Response.Body.FlushAsync();
                }
            }
            catch(OperationCanceledException)
            {
                Console.WriteLine($"Member Id '{memberId}': it seems that web client has quit from event stream");
                break;
            }
            catch(Exception ex)
            {
                Console.WriteLine($"Member Id '{memberId}': exception while trying to read from event stream: [{ex.GetType()}] {ex.Message}");
                break;
            }
        }

        Console.WriteLine($"Member Id '{memberId}' finishing event stream");
    }
}
