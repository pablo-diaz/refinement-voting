namespace backend;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddControllers();
        builder.Services.AddActorSystem();
        builder.Services.AddMemberStreamsConfiguration();

        var app = builder.Build();

        var loggerFactory = app.Services.GetRequiredService<ILoggerFactory>();
        Proto.Log.SetLoggerFactory(loggerFactory);

        app.UseHttpsRedirection();
        app.UseAuthorization();
        app.MapControllers();

        app.Run();
    }
}
