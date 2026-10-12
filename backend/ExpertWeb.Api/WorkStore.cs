namespace ExpertWeb.Api;

public sealed class WorkStore
{
    private readonly List<WorkDetails> _works = [SeedData.Work()];
    private readonly object _gate = new();

    public IReadOnlyList<WorkSummary> List()
    {
        lock (_gate)
        {
            return _works
                .Select(work => new WorkSummary(
                    work.Id,
                    work.Title,
                    work.Status,
                    work.Deal.ContractNumber,
                    work.Check.Matches.Count,
                    work.Check.Missing.Count))
                .OrderByDescending(work => work.Id)
                .ToArray();
        }
    }

    public WorkDetails? Get(int id)
    {
        lock (_gate)
        {
            return _works.FirstOrDefault(work => work.Id == id);
        }
    }

    public CreateResult Create(CreateWorkRequest request)
    {
        var title = (request.Title ?? "").Trim();
        if (title.Length == 0) return new CreateResult(null, "Укажите наименование работы.");
        if (request.Deal is null) return new CreateResult(null, "В работе нет сделки.");

        var goods = (request.Deal.Goods ?? [])
            .Take(20)
            .Select(good => new DealGood((good.Name ?? "").Trim(), (good.Tnved ?? "").Trim()))
            .ToList();
        if (goods.Count == 0) goods.Add(new DealGood("", ""));

        var deal = new Deal(
            (request.Deal.ContractNumber ?? "").Trim(),
            (request.Deal.ContractDate ?? "").Trim(),
            (request.Deal.RussianParty ?? "").Trim(),
            (request.Deal.ForeignParty ?? "").Trim(),
            (request.Deal.Country ?? "").Trim(),
            goods);
        var check = DealChecker.Check(deal, SeedData.Documents);

        lock (_gate)
        {
            var work = new WorkDetails(_works.Max(item => item.Id) + 1, title, "в работе", deal, check);
            _works.Add(work);
            return new CreateResult(work, null);
        }
    }
}
