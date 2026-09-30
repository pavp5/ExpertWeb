const FINFO_COLUMNS = [
  "Заключение",
  "Экспертная организация",
  "Документ — основание",
  "Российский участник",
  "Иностранный участник",
  "Конечный пользователь",
  "Товар",
  "Код ТНВЭД",
  "Пункты списков",
  "Выводы экспертизы",
];

export function LaterScreen({ kind }: { kind: "search" | "law" | "finfo" | "manual" }) {
  if (kind === "finfo") {
    return (
      <section className="panel card later">
        <h2>Контролируемые заключения</h2>
        <p className="lede">
          В настольной программе это FInfoUserControl: перечень заключений с выводами «Требуется лицензия»,
          «Требуется разрешение». Данные читаются запросом SELECT * FROM VFInfo. Представление к вебу не
          подключено.
        </p>
        <div className="table-wrap">
          <table className="finfo">
            <caption>Контролируемые заключения</caption>
            <thead>
              <tr>
                {FINFO_COLUMNS.map((column) => (
                  <th key={column}>{column}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="empty" colSpan={FINFO_COLUMNS.length}>
                  Нет строк: представление VFInfo не подключено.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  const copy = {
    search: {
      title: "Поиск работ",
      text: "Поиск работ в базе данных «Экспертной системы». Экран настольной программы — Cprp.DxData.FindA.FindUserControl, строка соединения берётся из ресурса EXDBACONNECTION. Сборки поиска в репозитории ExpertWin нет.",
    },
    law: {
      title: "Нормативные документы",
      text: "Сборник нормативно-правовых документов. Экран настольной программы — Cprp.DxData.Law.LawUserControl. Сборки в репозитории ExpertWin нет.",
    },
    manual: {
      title: "Руководство пользователя",
      text: "Настольная программа записывает ресурс manual во временный PDF и открывает его. Файл указан как Expert/bin/Release/manual.pdf и в git не входит.",
    },
  }[kind];

  return (
    <section className="panel card later">
      <h2>{copy.title}</h2>
      <p className="lede">{copy.text}</p>
    </section>
  );
}
