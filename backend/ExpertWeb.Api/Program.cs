using System.Text.Json;
using System.Text.Json.Serialization;
using ExpertWeb.Api;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://127.0.0.1:8787");
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    options.SerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
});
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy => policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});
builder.Services.AddSingleton<WorkStore>();

var app = builder.Build();
app.UseCors();

app.MapGet("/api/health", () => new { ok = true });
app.MapGet("/api/normative-documents", () => SeedData.Documents);
app.MapGet("/api/works", (WorkStore store) => store.List());
app.MapGet("/api/works/{id:int}", (int id, WorkStore store) =>
{
    var work = store.Get(id);
    return work is null
        ? Results.Json(new ErrorBody("Работа не найдена."), statusCode: StatusCodes.Status404NotFound)
        : Results.Ok(work);
});
app.MapPost("/api/works", async (HttpRequest request, WorkStore store) =>
{
    CreateWorkRequest? body;
    try
    {
        body = await request.ReadFromJsonAsync<CreateWorkRequest>();
    }
    catch (JsonException)
    {
        return Results.Json(new ErrorBody("Запрос не разобран."), statusCode: StatusCodes.Status400BadRequest);
    }

    if (body is null)
        return Results.Json(new ErrorBody("Запрос не разобран."), statusCode: StatusCodes.Status400BadRequest);

    var created = store.Create(body);
    if (created.Work is null)
        return Results.Json(new ErrorBody(created.Error ?? "Запрос не разобран."), statusCode: StatusCodes.Status400BadRequest);

    return Results.Created($"/api/works/{created.Work.Id}", created.Work);
});

app.Run();
