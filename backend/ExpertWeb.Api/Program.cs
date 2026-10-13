using ExpertWeb.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://127.0.0.1:8787");

var connectionString = builder.Configuration.GetConnectionString("ExpertWeb");
if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Не задана строка соединения ConnectionStrings:ExpertWeb (переменная ConnectionStrings__ExpertWeb). В репозитории её нет.");
}

builder.Services.AddDbContext<ExpertDb>(options => options.UseNpgsql(connectionString));
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<ExpertDb>().Database.Migrate();
}

app.MapGet("/api/health", () => new { ok = true });

app.MapGet("/api/countries", async (ExpertDb db) =>
    await db.Countries.AsNoTracking().OrderBy(item => item.IsoCode).ToListAsync());

app.MapGet("/api/countries/{id:int}", async (int id, ExpertDb db) =>
    await db.Countries.AsNoTracking().FirstOrDefaultAsync(item => item.Id == id) is { } row
        ? Results.Ok(row)
        : Results.NotFound());

app.MapGet("/api/units", async (ExpertDb db) =>
    await db.Units.AsNoTracking().OrderBy(item => item.Code).ToListAsync());

app.MapGet("/api/units/{id:int}", async (int id, ExpertDb db) =>
    await db.Units.AsNoTracking().FirstOrDefaultAsync(item => item.Id == id) is { } row
        ? Results.Ok(row)
        : Results.NotFound());

app.MapGet("/api/tnved", async (ExpertDb db) =>
    await db.TnvedNodes.AsNoTracking().OrderBy(item => item.Code)
        .Select(item => new { item.Id, item.Code, item.Name, item.ParentId })
        .ToListAsync());

app.MapGet("/api/tnved/{id:int}", async (int id, ExpertDb db) =>
    await db.TnvedNodes.AsNoTracking()
        .Where(item => item.Id == id)
        .Select(item => new { item.Id, item.Code, item.Name, item.ParentId })
        .FirstOrDefaultAsync() is { } row
        ? Results.Ok(row)
        : Results.NotFound());

app.MapGet("/api/documents", async (ExpertDb db) =>
    await db.Documents.AsNoTracking()
        .OrderBy(item => item.Code)
        .Select(item => new
        {
            item.Id,
            item.Kind,
            item.Code,
            item.Title,
            item.AdoptedOn,
            item.EffectiveFrom,
            item.EffectiveTo,
            tnvedIds = item.TnvedLinks.Select(link => link.TnvedId).ToArray(),
            countryIds = item.CountryLinks.Select(link => link.CountryId).ToArray(),
        })
        .ToListAsync());

app.MapGet("/api/documents/{id:int}", async (int id, ExpertDb db) =>
    await db.Documents.AsNoTracking()
        .Where(item => item.Id == id)
        .Select(item => new
        {
            item.Id,
            item.Kind,
            item.Code,
            item.Title,
            item.AdoptedOn,
            item.EffectiveFrom,
            item.EffectiveTo,
            tnvedIds = item.TnvedLinks.Select(link => link.TnvedId).ToArray(),
            countryIds = item.CountryLinks.Select(link => link.CountryId).ToArray(),
        })
        .FirstOrDefaultAsync() is { } row
        ? Results.Ok(row)
        : Results.NotFound());

app.Run();
