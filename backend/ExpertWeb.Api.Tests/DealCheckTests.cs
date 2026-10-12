using ExpertWeb.Api;

namespace ExpertWeb.Api.Tests;

public class DealCheckTests
{
    [Fact]
    public void Seed_work_shows_matches_and_gaps()
    {
        var work = new WorkStore().Get(1);
        Assert.NotNull(work);
        Assert.Equal(["ДОГ", "ЕП"], Codes(work!.Check.Matches));
        Assert.Equal(["ЕП", "ТНВЭД", "УЧ"], Codes(work.Check.Missing));
        Assert.Contains("иностранный контрагент", Detail(work.Check.Missing, "УЧ"));
        Assert.Contains("8413708000", Detail(work.Check.Matches, "ЕП"));
    }

    [Fact]
    public void Empty_deal_misses_every_document()
    {
        var check = DealChecker.Check(
            new Deal("", "", "", "", "", []),
            SeedData.Documents);
        Assert.Empty(check.Matches);
        Assert.Equal(SeedData.Documents.Count, check.Missing.Count);
    }

    [Fact]
    public void Create_checks_the_deal_and_opens_by_id()
    {
        var store = new WorkStore();
        var created = store.Create(new CreateWorkRequest(
            "  Поставка схем  ",
            new Deal(
                "ВЭД-9",
                "2026-04-01",
                "АО «Север»",
                "North Parts GmbH",
                "Германия",
                [new DealGood("Микросхема", "8542310000")])));

        Assert.NotNull(created.Work);
        Assert.Equal("Поставка схем", created.Work.Title);
        Assert.Equal("в работе", created.Work.Status);
        Assert.Empty(created.Work.Check.Missing);
        Assert.Equal(4, created.Work.Check.Matches.Count);
        Assert.Equal("Поставка схем", store.Get(created.Work.Id)?.Title);
        Assert.Equal(created.Work.Id, store.List()[0].Id);
    }

    [Fact]
    public void Blank_title_is_rejected()
    {
        var created = new WorkStore().Create(new CreateWorkRequest(
            "   ",
            new Deal("", "", "", "", "", [])));
        Assert.Null(created.Work);
        Assert.Equal("Укажите наименование работы.", created.Error);
    }

    private static string[] Codes(IReadOnlyList<CheckFinding> findings) =>
        findings.Select(item => item.DocumentCode).OrderBy(code => code, StringComparer.Ordinal).ToArray();

    private static string Detail(IReadOnlyList<CheckFinding> findings, string code) =>
        findings.Single(item => item.DocumentCode == code).Detail;
}
