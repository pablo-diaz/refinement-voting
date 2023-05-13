namespace backend.Actors.Messages;

public class SubmitVote
{
    public Guid InRoomId { get; }
    public Guid ByMemberId { get; }
    public short SubmittedVote { get; }

    public SubmitVote(Guid inRoomId, Guid byMemberId, short submittedVote)
    {
        InRoomId = inRoomId;
        ByMemberId = byMemberId;
        SubmittedVote = submittedVote;
    }
}