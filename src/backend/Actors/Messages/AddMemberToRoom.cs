namespace backend.Actors.Messages;

public class AddMemberToRoom {
    public Guid ToRoomId { get; }
    public string WithMemberName { get; }
    public MemberStream WithStream { get; } = new MemberStream();
    public Guid MemberId { get; } = Guid.NewGuid();

    public AddMemberToRoom(Guid toRoomId, string withMemberName)
    {
        ToRoomId = toRoomId;
        WithMemberName = withMemberName;
    }

}