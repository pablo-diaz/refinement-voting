namespace backend.Actors.Messages;

public class MemberHasSubmittedVote
{
    public string MemberName { get; }

    public MemberHasSubmittedVote(string memberName)
    {
        MemberName = memberName;
    }
}