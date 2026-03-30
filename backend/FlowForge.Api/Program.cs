using FlowForge.Api.Hubs;
using FlowForge.Application.Interfaces;
using FlowForge.Application.Services;
using FlowForge.Infrastructure.Data;
using FlowForge.Infrastructure.Repositories;
using Hangfire;
using Hangfire.MemoryStorage;
using Microsoft.EntityFrameworkCore;
using Serilog;

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .WriteTo.Console()
    .WriteTo.File("logs/flowforge-.log", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog();

    // ========== Database ==========
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? "Data Source=flowforge.db";
    builder.Services.AddDbContext<FlowForgeDbContext>(options =>
        options.UseSqlite(connectionString));

    // ========== Repositories ==========
    builder.Services.AddScoped<IWorkflowRepository, WorkflowRepository>();
    builder.Services.AddScoped<IExecutionRepository, ExecutionRepository>();
    builder.Services.AddScoped<IScheduleRepository, ScheduleRepository>();

    // ========== Application Services ==========
    builder.Services.AddScoped<IWorkflowService, WorkflowService>();
    builder.Services.AddScoped<IExecutionService, ExecutionService>();
    builder.Services.AddScoped<IScheduleService, ScheduleService>();

    // ========== Hangfire (Scheduling) ==========
    builder.Services.AddHangfire(config => config
        .SetDataCompatibilityLevel(CompatibilityLevel.Version_180)
        .UseSimpleAssemblyNameTypeSerializer()
        .UseRecommendedSerializerSettings()
        .UseMemoryStorage());
    builder.Services.AddHangfireServer();

    // ========== SignalR ==========
    builder.Services.AddSignalR();

    // ========== API ==========
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
            options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
        });

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new()
        {
            Title = "FlowForge API",
            Version = "v1",
            Description = "Visual Workflow Automation Builder API"
        });
    });

    // ========== CORS ==========
    var allowedOrigins = builder.Configuration["ALLOWED_ORIGINS"]?
        .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
        ?? Array.Empty<string>();
    var defaultOrigins = new[] { "http://localhost:3000", "http://localhost:3001", "https://localhost:3000" };
    var allOrigins = defaultOrigins.Concat(allowedOrigins).Distinct().ToArray();

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowFrontend", policy =>
        {
            policy.WithOrigins(allOrigins)
                .AllowAnyMethod()
                .AllowAnyHeader()
                .AllowCredentials();
        });
    });

    // ========== Health Checks ==========
    builder.Services.AddHealthChecks();

    // Use PORT env var if set (required by Render.com)
    var port = Environment.GetEnvironmentVariable("PORT") ?? "5000";
    builder.WebHost.UseUrls($"http://+:{port}");

    var app = builder.Build();

    // ========== Auto-migrate database ==========
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<FlowForgeDbContext>();
        await db.Database.EnsureCreatedAsync();
    }

    // ========== Middleware Pipeline ==========
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "FlowForge API v1");
        c.RoutePrefix = "swagger";
    });

    app.UseSerilogRequestLogging();
    app.UseCors("AllowFrontend");
    app.UseRouting();

    app.MapControllers();
    app.MapHub<WorkflowHub>("/hubs/workflow");
    app.UseHangfireDashboard("/hangfire");
    app.MapHealthChecks("/health");

    Log.Information("FlowForge API starting on {Urls}", string.Join(", ", app.Urls));
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "FlowForge API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
