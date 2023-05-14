namespace backend.Actors.Messages;

public class VotingResultHasBeenRevealed
{
    public MemberVotingResult[] Votes { get; }

    public VotingResultHasBeenRevealed(MemberVotingResult[] votes)
    {
        Votes = votes;
    }

    public class MemberVotingResult
    {
        public string MemberName { get; }
        public short Vote { get; }

        public MemberVotingResult(string memberName, short vote)
        {
            MemberName = memberName;
            Vote = vote;
        }
    }
}