namespace ExpertWeb.Api.Catalog;

public static class DocumentKind
{
    public const string Decree = "указ";
    public const string Resolution = "постановление";
    public const string ControlList = "контрольный список";

    public static readonly string[] All = [Decree, Resolution, ControlList];
}

public sealed class Country
{
    public int Id { get; set; }
    public string IsoCode { get; set; } = "";
    public string Name { get; set; } = "";
}

public sealed class Unit
{
    public int Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
}

public sealed class Tnved
{
    public int Id { get; set; }
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public int? ParentId { get; set; }
    public Tnved? Parent { get; set; }
}

public sealed class NormativeDocument
{
    public int Id { get; set; }
    public string Kind { get; set; } = "";
    public string Code { get; set; } = "";
    public string Title { get; set; } = "";
    public DateOnly AdoptedOn { get; set; }
    public DateOnly EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public List<DocumentTnved> TnvedLinks { get; set; } = [];
    public List<DocumentCountry> CountryLinks { get; set; } = [];
}

public sealed class DocumentTnved
{
    public int DocumentId { get; set; }
    public int TnvedId { get; set; }
}

public sealed class DocumentCountry
{
    public int DocumentId { get; set; }
    public int CountryId { get; set; }
}
