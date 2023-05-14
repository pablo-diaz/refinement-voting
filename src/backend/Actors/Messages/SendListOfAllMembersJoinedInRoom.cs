namespace backend.Actors.Messages;

public class SendListOfAllMembersJoinedInRoom
{
    public Guid InRoomId { get; }
    public Guid ToMemberId { get; }

    public SendListOfAllMembersJoinedInRoom(Guid inRoomId, Guid toMemberId)
    {
        InRoomId = inRoomId;
        ToMemberId = toMemberId;
    }
}