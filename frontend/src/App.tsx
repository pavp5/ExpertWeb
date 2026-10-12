import { useEffect, useState, type FormEvent } from "react";
import type { Deal, WorkDetails, WorkSummary } from "./types.ts";
import { createWork, fetchDocuments, fetchWork, fetchWorks } from "./api.ts";

type Route =
  | { name: "list" }
  | { name: "create" }
  | { name: "work"; id: number };

function readRoute(): Route {
  const work = window.location.pathname.match(/^\/works\/(\d+)$/);
  if (work) return { name: "work", id: Number(work[1]) };
  if (window.location.pathname === "/works/new") return { name: "create" };
  return { name: "list" };
}

function go(path: string) {
  window.history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

const emptyDeal: Deal = {
  contractNumber: "",
  contractDate: "",
  russianParty: "",
  foreignParty: "",
  country: "",
  goods: [{ name: "", tnved: "" }],
};

export function App() {
  const [route, setRoute] = useState<Route>(readRoute);

  useEffect(() => {
    const onPop = () => setRoute(readRoute());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>Работы</h1>
          <p className="lede">Сделка сверяется с нормативными документами.</p>
        </div>
        {route.name !== "create" && (
          <button type="button" onClick={() => go("/works/new")}>Создать работу</button>
        )}
      </header>
      {route.name === "list" && <WorkList onOpen={(id) => go(`/works/${id}`)} />}
      {route.name === "create" && <WorkForm onCancel={() => go("/")} onCreated={(id) => go(`/works/${id}`)} />}
      {route.name === "work" && <WorkView id={route.id} onBack={() => go("/")} />}
    </div>
  );
}

function WorkList({ onOpen }: { onOpen: (id: number) => void }) {
  const [works, setWorks] = useState<WorkSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorks().then(setWorks).catch((reason: Error) => setError(reason.message));
  }, []);

  if (error) return <p className="error">{error}</p>;
  if (!works) return <p className="notice">Загрузка работ…</p>;

  return (
    <section className="panel">
      <table className="works">
        <thead>
          <tr>
            <th>№</th>
            <th>Работа</th>
            <th>Договор</th>
            <th>Состояние</th>
            <th>Сверка</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {works.map((work) => (
            <tr key={work.id}>
              <td>{work.id}</td>
              <td>{work.title}</td>
              <td>{work.contractNumber || "—"}</td>
              <td>{work.status}</td>
              <td>совпало {work.matchCount}, не хватает {work.missingCount}</td>
              <td><button type="button" className="secondary" onClick={() => onOpen(work.id)}>Открыть</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function WorkForm({ onCancel, onCreated }: { onCancel: () => void; onCreated: (id: number) => void }) {
  const [title, setTitle] = useState("");
  const [deal, setDeal] = useState<Deal>(emptyDeal);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const good = deal.goods[0] ?? { name: "", tnved: "" };

  function patch(partial: Partial<Deal>) {
    setDeal((current) => ({ ...current, ...partial }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const work = await createWork({ title, deal: { ...deal, goods: [good] } });
      onCreated(work.id);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Запрос не выполнен.");
      setPending(false);
    }
  }

  return (
    <form className="panel" onSubmit={submit}>
      <h2>Новая работа</h2>
      <label className="stack">
        Наименование работы
        <input value={title} onChange={(event) => setTitle(event.target.value)} required />
      </label>
      <h2>Сделка</h2>
      <div className="grid">
        <label className="stack">
          Номер договора
          <input value={deal.contractNumber} onChange={(event) => patch({ contractNumber: event.target.value })} />
        </label>
        <label className="stack">
          Дата договора
          <input type="date" value={deal.contractDate} onChange={(event) => patch({ contractDate: event.target.value })} />
        </label>
        <label className="stack">
          Российский участник
          <input value={deal.russianParty} onChange={(event) => patch({ russianParty: event.target.value })} />
        </label>
        <label className="stack">
          Иностранный контрагент
          <input value={deal.foreignParty} onChange={(event) => patch({ foreignParty: event.target.value })} />
        </label>
        <label className="stack">
          Страна назначения
          <input value={deal.country} onChange={(event) => patch({ country: event.target.value })} />
        </label>
      </div>
      <h2>Товар</h2>
      <div className="grid">
        <label className="stack">
          Наименование товара
          <input value={good.name} onChange={(event) => patch({ goods: [{ ...good, name: event.target.value }] })} />
        </label>
        <label className="stack">
          Код ТН ВЭД
          <input value={good.tnved} onChange={(event) => patch({ goods: [{ ...good, tnved: event.target.value }] })} />
        </label>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="top">
        <button type="submit" disabled={pending}>Создать</button>
        <button type="button" className="secondary" onClick={onCancel}>К списку</button>
      </div>
    </form>
  );
}

function WorkView({ id, onBack }: { id: number; onBack: () => void }) {
  const [work, setWork] = useState<WorkDetails | null>(null);
  const [documentCount, setDocumentCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setWork(null);
    setError(null);
    fetchWork(id).then(setWork).catch((reason: Error) => setError(reason.message));
    fetchDocuments().then((documents) => setDocumentCount(documents.length)).catch(() => setDocumentCount(null));
  }, [id]);

  useEffect(() => {
    if (work) document.title = `Работа № ${work.id}`;
  }, [work]);

  if (error) return <p className="error">{error}</p>;
  if (!work) return <p className="notice">Загрузка работы…</p>;

  return (
    <article>
      <section className="panel">
        <h2>Работа № {work.id}</h2>
        <dl className="facts">
          <dt>Наименование</dt>
          <dd>{work.title}</dd>
          <dt>Состояние</dt>
          <dd>{work.status}</dd>
        </dl>
      </section>
      <section className="panel">
        <h2>Сделка</h2>
        <dl className="facts">
          <dt>Номер договора</dt>
          <dd>{work.deal.contractNumber || "—"}</dd>
          <dt>Дата договора</dt>
          <dd>{work.deal.contractDate || "—"}</dd>
          <dt>Российский участник</dt>
          <dd>{work.deal.russianParty || "—"}</dd>
          <dt>Иностранный контрагент</dt>
          <dd>{work.deal.foreignParty || "—"}</dd>
          <dt>Страна назначения</dt>
          <dd>{work.deal.country || "—"}</dd>
          <dt>Товары</dt>
          <dd>
            {work.deal.goods.length === 0 && "—"}
            {work.deal.goods.map((good, index) => (
              <div key={`${good.name}-${index}`}>{good.name || "без наименования"}{good.tnved ? `, ТН ВЭД ${good.tnved}` : ", код ТН ВЭД не указан"}</div>
            ))}
          </dd>
        </dl>
      </section>
      <section className="panel">
        <h2>Сверка с нормативными документами</h2>
        <p className="lede">Документов в базе: {documentCount ?? "…"}. Совпало {work.check.matches.length}, не хватает {work.check.missing.length}.</p>
        <div className="check-grid">
          <div>
            <h3>Совпало</h3>
            <FindingList items={work.check.matches} empty="Совпадений нет." />
          </div>
          <div>
            <h3>Не хватает</h3>
            <FindingList items={work.check.missing} empty="Пробелов нет." />
          </div>
        </div>
      </section>
      <button type="button" className="secondary" onClick={onBack}>К списку</button>
    </article>
  );
}

function FindingList({ items, empty }: { items: WorkDetails["check"]["matches"]; empty: string }) {
  if (items.length === 0) return <p className="notice">{empty}</p>;
  return (
    <ul className="findings">
      {items.map((item) => (
        <li key={`${item.documentCode}-${item.detail}`}>
          <strong>{item.documentCode}. {item.documentTitle}</strong>
          <span>{item.detail}</span>
        </li>
      ))}
    </ul>
  );
}
