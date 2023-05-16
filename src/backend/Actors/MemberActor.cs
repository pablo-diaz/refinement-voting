using backend.Actors.Messages;
using Proto;

namespace backend.Actors;

public class MemberActor : IActor
{
    private readonly Guid _memberId;
    private readonly string _memberName;
    private readonly MemberStream _withStream;

    public MemberActor(Guid withMemberId, string withMemberName, MemberStream withStream)
    {
        this._memberId = withMemberId;
        this._memberName = withMemberName;
        this._withStream = withStream;
    }

    public Task ReceiveAsync(IContext context) =>
        context.Message switch {
            Stopped stoppedEvent => HandleStoppedEvent(stoppedEvent),
            NewMemberHasJoined newMemberJoinedEvent => ProcessNewMemberJoinedEvent(newMemberJoinedEvent),
            NewVotingSessionHasStarted newVotingSessionHasStarted => ProcessNewVotingSessionHasStartedEvent(),
            MemberHasSubmittedVote submittedVote => ProcessMemberHasSubmittedVoteEvent(submittedVote),
            VotingResultHasBeenRevealed votingResults => ProcessVotingResultRevealedEvent(votingResults),
            _ => Task.CompletedTask
        };

    private Task HandleStoppedEvent(Stopped stoppedEvent)
    {
        Console.WriteLine($"Member {_memberId} actor has stopped successfully");
        return Task.CompletedTask;
    }

    private Task ProcessNewMemberJoinedEvent(NewMemberHasJoined @event)
    {
        return SendMessage(new { EventType = "NewMemberHasJoined", EventData = new { MemberName = @event.MemberName } });
    }

    private Task ProcessNewVotingSessionHasStartedEvent()
    {
        return SendMessage(new { EventType = "NewVotingSessionHasStarted" });
    }

    private Task ProcessMemberHasSubmittedVoteEvent(MemberHasSubmittedVote submittedVote)
    {
        return SendMessage(new { EventType = "MemberHasVoted", EventData = new { MemberName = submittedVote.MemberName } });
    }

    private Task ProcessVotingResultRevealedEvent(VotingResultHasBeenRevealed votingResults)
    {
        return SendMessage(new { EventType = "VotingResultRevealed", EventData = new { Votes = votingResults.Votes, Average = votingResults.Average } });
    }

    private Task SendMessage(object messageToSend)
    {
        _withStream.TryToSendMessage?.Invoke(Newtonsoft.Json.JsonConvert.SerializeObject(messageToSend));
        return Task.CompletedTask;
    }
}