namespace backend;

public class Program
{
    public static void Main(string[] args)
    {
        var  allowSpecificOrigins = "_myAllowSpecificOrigins";

        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddCors(options => {
            options.AddPolicy(name: allowSpecificOrigins,
                policy => { policy.WithOrigins("http://localhost:3000").AllowAnyHeader().AllowAnyMethod(); });
        });

        builder.Services.AddControllers();
        builder.Services.AddActorSystem();
        builder.Services.AddMemberStreamsConfiguration();

        var app = builder.Build();

        var loggerFactory = app.Services.GetRequiredService<ILoggerFactory>();
        Proto.Log.SetLoggerFactory(loggerFactory);

        app.UseHttpsRedirection();
        app.UseCors(allowSpecificOrigins);
        app.UseAuthorization();
        app.MapControllers();

        app.Run();
    }
}
