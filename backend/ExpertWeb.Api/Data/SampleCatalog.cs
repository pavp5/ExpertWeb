using ExpertWeb.Api.Catalog;
using Microsoft.EntityFrameworkCore;

namespace ExpertWeb.Api.Data;

/// <summary>
/// Учебные строки для проверки справочников. Это не номенклатура ТН ВЭД и не официальные тексты актов.
/// </summary>
public static class SampleCatalog
{
    public static void Apply(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Country>().HasData(
            new Country { Id = 1, IsoCode = "RU", Name = "Образец: Россия" },
            new Country { Id = 2, IsoCode = "KZ", Name = "Образец: Казахстан" },
            new Country { Id = 3, IsoCode = "DE", Name = "Образец: Германия" });

        modelBuilder.Entity<Unit>().HasData(
            new Unit { Id = 1, Code = "шт", Name = "Образец: штука" },
            new Unit { Id = 2, Code = "кг", Name = "Образец: килограмм" });

        modelBuilder.Entity<Tnved>().HasData(
            new Tnved { Id = 1, Code = "84", Name = "Образец: машины и оборудование", ParentId = null },
            new Tnved { Id = 2, Code = "8413", Name = "Образец: насосы", ParentId = 1 },
            new Tnved { Id = 3, Code = "841370", Name = "Образец: насосы центробежные", ParentId = 2 },
            new Tnved { Id = 4, Code = "85", Name = "Образец: электрические машины", ParentId = null },
            new Tnved { Id = 5, Code = "8542", Name = "Образец: интегральные схемы", ParentId = 4 });

        modelBuilder.Entity<NormativeDocument>().HasData(
            new NormativeDocument
            {
                Id = 1,
                Kind = DocumentKind.Decree,
                Code = "ОБР-УКАЗ-1",
                Title = "Образец указа",
                AdoptedOn = new DateOnly(2020, 1, 15),
                EffectiveFrom = new DateOnly(2020, 2, 1),
                EffectiveTo = null,
            },
            new NormativeDocument
            {
                Id = 2,
                Kind = DocumentKind.Resolution,
                Code = "ОБР-ПОСТ-1",
                Title = "Образец постановления",
                AdoptedOn = new DateOnly(2021, 6, 1),
                EffectiveFrom = new DateOnly(2021, 7, 1),
                EffectiveTo = new DateOnly(2024, 12, 31),
            },
            new NormativeDocument
            {
                Id = 3,
                Kind = DocumentKind.ControlList,
                Code = "ОБР-КС-1",
                Title = "Образец контрольного списка",
                AdoptedOn = new DateOnly(2019, 3, 10),
                EffectiveFrom = new DateOnly(2019, 4, 1),
                EffectiveTo = null,
            });

        modelBuilder.Entity<DocumentTnved>().HasData(
            new DocumentTnved { DocumentId = 1, TnvedId = 3 },
            new DocumentTnved { DocumentId = 3, TnvedId = 2 },
            new DocumentTnved { DocumentId = 3, TnvedId = 5 });

        modelBuilder.Entity<DocumentCountry>().HasData(
            new DocumentCountry { DocumentId = 1, CountryId = 2 },
            new DocumentCountry { DocumentId = 2, CountryId = 3 },
            new DocumentCountry { DocumentId = 3, CountryId = 1 },
            new DocumentCountry { DocumentId = 3, CountryId = 2 });
    }
}
