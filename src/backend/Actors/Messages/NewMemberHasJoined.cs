namespace backend.Actors.Messages;

public class NewMemberHasJoined
{
    public string MemberName { get; }

    public NewMemberHasJoined(string memberName)
    {
        MemberName = memberName;
    }
}