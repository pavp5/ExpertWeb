namespace ExpertWeb.Api;

public sealed record DealGood(string Name, string Tnved);

public sealed record Deal(
    string ContractNumber,
    string ContractDate,
    string RussianParty,
    string ForeignParty,
    string Country,
    IReadOnlyList<DealGood> Goods);

public sealed record CheckFinding(string DocumentCode, string DocumentTitle, string Detail);

public sealed record DealCheck(IReadOnlyList<CheckFinding> Matches, IReadOnlyList<CheckFinding> Missing);

public sealed record WorkSummary(
    int Id,
    string Title,
    string Status,
    string ContractNumber,
    int MatchCount,
    int MissingCount);

public sealed record WorkDetails(int Id, string Title, string Status, Deal Deal, DealCheck Check);

public sealed record ListPrefix(string Prefix, string Caption);

public sealed record NormativeDocument(
    string Id,
    string Code,
    string Title,
    string Kind,
    IReadOnlyList<ListPrefix>? Prefixes);

public sealed record CreateWorkRequest(string? Title, Deal? Deal);

public sealed record ErrorBody(string Error);

public readonly record struct CreateResult(WorkDetails? Work, string? Error);
