using backend.Actors.Messages;
using Proto;

namespace backend.Actors;

public class RoomsManagerActor : IActor
{
    private readonly Dictionary<Guid, PID> _votingRooms = new Dictionary<Guid, PID>();

    public Task ReceiveAsync(IContext context) =>
        context.Message switch {
            CreateVotingRoom newVotingRoomInfo => AddNewVotingRoom(context, newVotingRoomInfo),
            AddMemberToRoom newMemberInfo => TryForwardMessageToRoom(context, toRoomId: newMemberInfo.ToRoomId, messageToForward: newMemberInfo),
            SendListOfAllMembersJoinedInRoom sendListInfo => TryForwardMessageToRoom(context, toRoomId: sendListInfo.InRoomId, messageToForward: sendListInfo),
            StartNewVotingSession startNewVotingSession => TryForwardMessageToRoom(context, toRoomId: startNewVotingSession.InRoomId, messageToForward: startNewVotingSession),
            SubmitVote voteSubmitted => TryForwardMessageToRoom(context, toRoomId: voteSubmitted.InRoomId, messageToForward: voteSubmitted),
            RevealVotingResults revealResults => TryForwardMessageToRoom(context, toRoomId: revealResults.InRoomId, messageToForward: revealResults),
            _ => Task.CompletedTask
        };

    private Task AddNewVotingRoom(IContext context, CreateVotingRoom newVotingRoomInfo) 
    {
        var props = Props.FromProducer(() => new RoomActor(withRoomId: newVotingRoomInfo.Id, withLeaderName: newVotingRoomInfo.LeaderName));
        _votingRooms[newVotingRoomInfo.Id] = context.Spawn(props);

        return Task.CompletedTask;
    }

    private Task TryForwardMessageToRoom(IContext context, Guid toRoomId, object messageToForward)
    {
        if(!_votingRooms.ContainsKey(toRoomId))
        {
            Console.WriteLine("Room was not found");
            return Task.CompletedTask;
        }

        context.Send(_votingRooms[toRoomId], messageToForward);

        return Task.CompletedTask;
    }
}