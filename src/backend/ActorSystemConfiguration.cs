using backend.Actors;
using Proto;
using Proto.DependencyInjection;

namespace backend;

public static class ActorSystemConfigurationExtensions
{
    public static void AddActorSystem(this IServiceCollection serviceCollection)
    {
        serviceCollection.AddSingleton(provider => {
            var actorSystem = new ActorSystem(ActorSystemConfig.Setup())
                .WithServiceProvider(provider);

            var props = Props.FromProducer(() => new RoomsManagerActor());

            return new ActorSystemConfiguration(withActorSystem: actorSystem, withRoomsManagerActor: actorSystem.Root.Spawn(props));
        });
    }
}

public class ActorSystemConfiguration
{
    public ActorSystem ActorSystem { get; }
    public PID RoomsManagerActor { get; }

    public ActorSystemConfiguration(ActorSystem withActorSystem, PID withRoomsManagerActor)
    {
        ActorSystem = withActorSystem;
        RoomsManagerActor = withRoomsManagerActor;
    }
}
