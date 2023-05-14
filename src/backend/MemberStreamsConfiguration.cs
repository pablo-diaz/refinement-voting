using System.Collections.Concurrent;

namespace backend;

public class MemberStream
{
    public delegate void SendMessage(string jsonMessage);
    public SendMessage? TryToSendMessage = null;
}

public class MemberStreamsConfiguration
{
    private readonly ConcurrentDictionary<Guid, MemberStream> _memberStreams = new ConcurrentDictionary<Guid, MemberStream>();

    public void AddMemberStream(Guid toMemberId, MemberStream withStream)
    {
        _memberStreams[toMemberId] = withStream;
    }

    public (bool Found, MemberStream? Stream) TryGetMemberStream(Guid forMemberId) =>
        _memberStreams.ContainsKey(forMemberId)
        ? (Found: true, Stream: _memberStreams[forMemberId])
        : (Found: false, Stream: null);
}

public static class MemberStreamsConfigExtensions
{
    public static void AddMemberStreamsConfiguration(this IServiceCollection serviceCollection)
    {
        serviceCollection.AddSingleton(provider => new MemberStreamsConfiguration());
    }
}