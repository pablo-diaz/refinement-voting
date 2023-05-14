using backend.Actors.Messages;
using Proto;

namespace backend.Actors;

public class RoomsManagerActor : IActor
{
    private readonly double _maxMilliSecondsForIdleRoom = TimeSpan.FromHours(1).TotalMilliseconds;
    private readonly Dictionary<Guid, (PID RoomPid, System.Timers.Timer RoomIdleWatchingTimer)> _votingRooms = new();

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
        _votingRooms[newVotingRoomInfo.Id] = (
            RoomPid: context.Spawn(props),
            RoomIdleWatchingTimer: new System.Timers.Timer(interval: _maxMilliSecondsForIdleRoom)
        );

        _votingRooms[newVotingRoomInfo.Id].RoomIdleWatchingTimer.Elapsed += (sender, @event) => StopIdleRoomActor(context, roomIdBeingWatched: newVotingRoomInfo.Id);
        _votingRooms[newVotingRoomInfo.Id].RoomIdleWatchingTimer.Start();

        return Task.CompletedTask;
    }

    private Task TryForwardMessageToRoom(IContext context, Guid toRoomId, object messageToForward)
    {
        if(!_votingRooms.ContainsKey(toRoomId))
        {
            Console.WriteLine("Room was not found");
            return Task.CompletedTask;
        }

        context.Send(_votingRooms[toRoomId].RoomPid, messageToForward);

        RestartRoomIdleWatchingTimer(toRoomId);
        
        return Task.CompletedTask;
    }

    private void RestartRoomIdleWatchingTimer(Guid forRoomId)
    {
        _votingRooms[forRoomId].RoomIdleWatchingTimer.Stop();
        _votingRooms[forRoomId].RoomIdleWatchingTimer.Start();
    }

    private void StopIdleRoomActor(IContext context, Guid roomIdBeingWatched)
    {
        Console.WriteLine($"Room {roomIdBeingWatched} is idle, so it is being stopped");
        if(_votingRooms.ContainsKey(roomIdBeingWatched) == false)
            return;

        context.Stop(_votingRooms[roomIdBeingWatched].RoomPid);
        _votingRooms[roomIdBeingWatched].RoomIdleWatchingTimer.Dispose();
        _votingRooms.Remove(roomIdBeingWatched);
    }
}