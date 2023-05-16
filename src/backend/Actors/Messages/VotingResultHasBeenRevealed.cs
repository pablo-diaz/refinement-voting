namespace backend.Actors.Messages;

public class VotingResultHasBeenRevealed
{
    public MemberVotingResult[] Votes { get; }
    public decimal Average { get => Votes.Where(v => v.Vote > 0).Select(v => (decimal)v.Vote).Average(); }

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