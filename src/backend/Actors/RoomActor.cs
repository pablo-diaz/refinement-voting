using backend.Actors.Messages;
using Proto;

namespace backend.Actors;

public class RoomActor : IActor
{
    private enum RoomStatus { JUST_CREATED, VOTING, RESULTS_REVEALED }
    private readonly short VoteHasNotBeenSubmittedYet = 0;
    private readonly Guid _roomId;
    private readonly string _leaderName;
    private RoomStatus _status = RoomStatus.JUST_CREATED;
    private readonly Dictionary<Guid, (PID MemberPid, string MemberName)> _members = new();
    
    // I've decided to keep votes here in the room, and not within each Member actor, so that I don't ahve to query each actor when sending voting results to each member
    private readonly Dictionary<Guid, short> _submittedVotes = new();

    public RoomActor(Guid withRoomId, string withLeaderName)
    {
        _roomId = withRoomId;
        _leaderName = withLeaderName;

        Console.WriteLine($"New room has been created with id {this._roomId} and with leader name {this._leaderName}");
    }

    public Task ReceiveAsync(IContext context) =>
        context.Message switch {
            Stopped stoppedEvent => HandleStoppedEvent(stoppedEvent),
            AddMemberToRoom newMemberInfo => AddNewMember(context, newMemberInfo),
            SendListOfAllMembersJoinedInRoom sendListInfo => SendListOfAllMembersJoinedInRoomToMember(context, sendListInfo),
            StartNewVotingSession startNewVotingSession => StartNewVotingSessionInRoom(context),
            SubmitVote voteSubmitted => ProcessSubmittingVote(context, voteSubmitted),
            RevealVotingResults revealResults => RevealResultsInCurrentVotingSession(context),
            _ => Task.CompletedTask
        };

    private Task HandleStoppedEvent(Stopped stoppedEvent)
    {
        Console.WriteLine($"Room {_roomId} actor has stopped successfully");
        return Task.CompletedTask;
    }

    private Task AddNewMember(IContext context, AddMemberToRoom newMemberInfo) {
        if(CanMemberBeAdded(withMemberName: newMemberInfo.WithMemberName) == false)
        {
            Console.WriteLine($"Member '{newMemberInfo.WithMemberName}' cannot be added, because there was already another one with the same name in this same room");
            return Task.CompletedTask;
        }

        var newJoinedMemberPid = AddNewMemberToRoom(context, newMemberInfo);
        CommunicateAllMembersInRoomThatNewMemberHasJoined(context, newMemberName: newMemberInfo.WithMemberName);

        return Task.CompletedTask;
    }

    private bool CanMemberBeAdded(string withMemberName) =>
        _members.Any(kvp => kvp.Value.MemberName.Trim().ToLower() == withMemberName.Trim().ToLower()) == false;

    private Task SendListOfAllMembersJoinedInRoomToMember(IContext context, SendListOfAllMembersJoinedInRoom info) 
    {
        if(!_members.ContainsKey(info.ToMemberId))
        {
            Console.WriteLine("Member does not exist in room");
            return Task.CompletedTask;
        }

        SendNamesOfPreviouslyJoinedMembersToNewJoinedMember(context, toMemberPid: _members[info.ToMemberId].MemberPid);

        return Task.CompletedTask;
    }

    private Task StartNewVotingSessionInRoom(IContext context)
    {
        ClearAllPreviouslySubmittedVotes();
        SendEventToAllMembers(context, eventMessageToSend: new NewVotingSessionHasStarted());

        _status = RoomStatus.VOTING;

        return Task.CompletedTask;
    }

    private void ClearAllPreviouslySubmittedVotes()
    {
        foreach(var kvp in _members)
            _submittedVotes[kvp.Key] = VoteHasNotBeenSubmittedYet;
    }

    private Task ProcessSubmittingVote(IContext context, SubmitVote message)
    {
        if(_status != RoomStatus.VOTING)
        {
            Console.WriteLine("Cannot vote, because voting session has not started");
            return Task.CompletedTask;
        }

        if(!_members.ContainsKey(message.ByMemberId))
        {
            Console.WriteLine("Member does not exist in room");
            return Task.CompletedTask;
        }

        if(IsVoteValid(message.SubmittedVote) == false)
        {
            Console.WriteLine($"Vote '{message.SubmittedVote}' is not valid");
            return Task.CompletedTask;
        }

        _submittedVotes[message.ByMemberId] = message.SubmittedVote;
        
        SendEventToAllMembers(context, eventMessageToSend: new MemberHasSubmittedVote(memberName: _members[message.ByMemberId].MemberName));

        return Task.CompletedTask;
    }

    private bool IsVoteValid(short vote) =>
        1 <= vote && vote <= 13;

    private Task RevealResultsInCurrentVotingSession(IContext context)
    {
        if(_status != RoomStatus.VOTING)
        {
            Console.WriteLine("Room is not in Voting status");
            return Task.CompletedTask;
        }

        _status = RoomStatus.RESULTS_REVEALED;

        SendEventToAllMembers(context, eventMessageToSend: BuildVotingResultsEvent());

        return Task.CompletedTask;
    }

    private VotingResultHasBeenRevealed BuildVotingResultsEvent() =>
        new VotingResultHasBeenRevealed(votes: _submittedVotes
            .Select(kvp => new VotingResultHasBeenRevealed.MemberVotingResult(
                memberName: _members[kvp.Key].MemberName, vote: kvp.Value))
            .ToArray()
        );

    private PID AddNewMemberToRoom(IContext context, AddMemberToRoom newMemberInfo)
    {
        var props = Props.FromProducer(() => new MemberActor(withMemberId: newMemberInfo.MemberId, withMemberName: newMemberInfo.WithMemberName, withStream: newMemberInfo.WithStream));
        var newJoinedMemberPid = context.Spawn(props);
        _members[newMemberInfo.MemberId] = (MemberPid: newJoinedMemberPid, MemberName: newMemberInfo.WithMemberName);

        Console.WriteLine($"New member with name {newMemberInfo.WithMemberName} and with Id {newMemberInfo.MemberId} has been added to room id {this._roomId}");

        return newJoinedMemberPid;
    }

    private void SendNamesOfPreviouslyJoinedMembersToNewJoinedMember(IContext context, PID toMemberPid)
    {
        _members
            .Select(kvp => kvp.Value.MemberName)
            .ToList()
            .ForEach(previouslyJoinedMemberName => context.Send(toMemberPid, new NewMemberHasJoined(memberName: previouslyJoinedMemberName)));

        Console.WriteLine($"Member list has been sent to member");
    }

    private void CommunicateAllMembersInRoomThatNewMemberHasJoined(IContext context, string newMemberName)
    {
        SendEventToAllMembers(context, eventMessageToSend: new NewMemberHasJoined(memberName: newMemberName));
    }

    private void SendEventToAllMembers(IContext context, object eventMessageToSend)
    {
        foreach(var member in _members)
            context.Send(member.Value.MemberPid, eventMessageToSend);
    }
}
