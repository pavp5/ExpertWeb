namespace ExpertWeb.Api;

public static class SeedData
{
    public static IReadOnlyList<NormativeDocument> Documents { get; } =
    [
        new("contract", "ДОГ", "Договор внешнеэкономической сделки", "contract", null),
        new("parties", "УЧ", "Участники внешнеэкономической операции", "parties", null),
        new("goods", "ТНВЭД", "Код товара по ТН ВЭД ЕАЭС", "goods", null),
        new(
            "unified-list",
            "ЕП",
            "Единый перечень товаров и технологий",
            "unified-list",
            [
                new ListPrefix("8413", "насосы жидкостные"),
                new ListPrefix("8542", "электронные интегральные схемы"),
                new ListPrefix("8802", "летательные аппараты"),
            ]),
    ];

    public static WorkDetails Work()
    {
        var deal = new Deal(
            "ВЭД-104",
            "2026-03-12",
            "ООО «Промдеталь»",
            "",
            "Казахстан",
            [
                new DealGood("Насос центробежный", "8413708000"),
                new DealGood("Модуль управления", ""),
            ]);
        return new WorkDetails(1, "Поставка насоса и модуля управления", "в работе", deal, DealChecker.Check(deal, Documents));
    }
}
