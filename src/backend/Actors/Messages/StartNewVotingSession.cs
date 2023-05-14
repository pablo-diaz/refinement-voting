namespace backend.Actors.Messages;

public class StartNewVotingSession
{
    public Guid InRoomId { get; }

    public StartNewVotingSession(Guid inRoomId)
    {
        InRoomId = inRoomId;
    }
}