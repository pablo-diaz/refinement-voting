namespace backend.Actors.Messages;

public class CreateVotingRoom {
    public Guid Id { get; } = Guid.NewGuid();
    public string LeaderName { get; }
    public CreateVotingRoom(string withLeaderName)
    {
        this.LeaderName = withLeaderName;
    }
}
