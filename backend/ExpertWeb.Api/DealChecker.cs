using System.Text.RegularExpressions;

namespace ExpertWeb.Api;

public static class DealChecker
{
    public static DealCheck Check(Deal deal, IReadOnlyList<NormativeDocument> documents)
    {
        var matches = new List<CheckFinding>();
        var missing = new List<CheckFinding>();
        foreach (var document in documents)
        {
            var part = document.Kind switch
            {
                "contract" => CheckContract(deal, document),
                "parties" => CheckParties(deal, document),
                "goods" => CheckGoods(deal, document),
                _ => CheckUnifiedList(deal, document),
            };
            matches.AddRange(part.Matches);
            missing.AddRange(part.Missing);
        }
        return new DealCheck(matches, missing);
    }

    private static string Text(string? value) => (value ?? "").Trim();

    private static CheckFinding Finding(NormativeDocument document, string detail) =>
        new(document.Code, document.Title, detail);

    private static string GoodLabel(DealGood good, int index)
    {
        var name = Text(good.Name);
        return name.Length > 0 ? name : $"товар {index + 1}";
    }

    private static bool TnvedOk(string? value) => Regex.IsMatch(Text(value), "^\\d{4,10}$");

    private static DealCheck CheckContract(Deal deal, NormativeDocument document)
    {
        var number = Text(deal.ContractNumber);
        var date = Text(deal.ContractDate);
        var gaps = new List<string>();
        if (number.Length == 0) gaps.Add("не указан номер договора");
        if (date.Length == 0) gaps.Add("не указана дата договора");
        if (gaps.Count == 0)
            return new DealCheck([Finding(document, $"Договор № {number} от {date}.")], []);
        return new DealCheck([], [Finding(document, $"{string.Join("; ", gaps)}.")]);
    }

    private static DealCheck CheckParties(Deal deal, NormativeDocument document)
    {
        var russian = Text(deal.RussianParty);
        var foreign = Text(deal.ForeignParty);
        var country = Text(deal.Country);
        var gaps = new List<string>();
        if (russian.Length == 0) gaps.Add("не указан российский участник");
        if (foreign.Length == 0) gaps.Add("не указан иностранный контрагент");
        if (country.Length == 0) gaps.Add("не указана страна назначения");
        if (gaps.Count == 0)
            return new DealCheck([Finding(document, $"{russian}; {foreign}; {country}.")], []);
        return new DealCheck([], [Finding(document, $"{string.Join("; ", gaps)}.")]);
    }

    private static DealCheck CheckGoods(Deal deal, NormativeDocument document)
    {
        if (deal.Goods.Count == 0)
            return new DealCheck([], [Finding(document, "В сделке нет товаров.")]);
        var gaps = new List<string>();
        for (var index = 0; index < deal.Goods.Count; index++)
        {
            var good = deal.Goods[index];
            var label = GoodLabel(good, index);
            if (Text(good.Name).Length == 0) gaps.Add($"у {label} не указано наименование");
            if (!TnvedOk(good.Tnved)) gaps.Add($"у «{label}» не указан код ТН ВЭД из 4–10 цифр");
        }
        if (gaps.Count == 0)
            return new DealCheck([Finding(document, $"Товаров с кодом ТН ВЭД: {deal.Goods.Count}.")], []);
        return new DealCheck([], [Finding(document, $"{string.Join("; ", gaps)}.")]);
    }

    private static DealCheck CheckUnifiedList(Deal deal, NormativeDocument document)
    {
        var prefixes = document.Prefixes ?? [];
        if (deal.Goods.Count == 0)
            return new DealCheck([], [Finding(document, "Нет товаров для сверки с перечнем.")]);
        var found = new List<string>();
        var gaps = new List<string>();
        for (var index = 0; index < deal.Goods.Count; index++)
        {
            var good = deal.Goods[index];
            var label = GoodLabel(good, index);
            var code = Text(good.Tnved);
            if (!TnvedOk(code))
            {
                gaps.Add($"у «{label}» нет кода ТН ВЭД для сверки");
                continue;
            }
            var hit = prefixes.FirstOrDefault(item => code.StartsWith(item.Prefix, StringComparison.Ordinal));
            if (hit is not null) found.Add($"«{label}», код {code}: {hit.Caption}");
            else gaps.Add($"код {code} («{label}») в перечне не найден");
        }
        return new DealCheck(
            found.Count > 0 ? [Finding(document, $"{string.Join(". ", found)}.")] : [],
            gaps.Count > 0 ? [Finding(document, $"{string.Join("; ", gaps)}.")] : []);
    }
}
