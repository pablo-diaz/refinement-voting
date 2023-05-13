namespace backend.Actors.Messages;

public class RevealVotingResults
{
    public Guid InRoomId { get; }

    public RevealVotingResults(Guid inRoomId)
    {
        InRoomId = inRoomId;
    }
}