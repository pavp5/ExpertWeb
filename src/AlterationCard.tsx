import { useState } from "react";
import type { Work } from "./domain.ts";
import { formatDateTime } from "./plan.ts";
import {
  alterationWorkCaption,
  buildAlterationTree,
  changeSummaryLabel,
  type AlterationDossier,
} from "./alteration.ts";

interface AlterationCardProps {
  work: Work;
  dossier: AlterationDossier;
  notice: string | null;
  onChange: (next: AlterationDossier) => void;
  onSave: () => void;
  onReload: () => void;
  onSend: () => void;
  onClose: () => void;
}

type MainMode = "section" | "plane" | "letter" | "request";

export function AlterationCard({
  work,
  dossier,
  notice,
  onChange,
  onSave,
  onReload,
  onSend,
  onClose,
}: AlterationCardProps) {
  const editable = work.condition === "work";
  const tree = buildAlterationTree();
  const [mode, setMode] = useState<MainMode>("section");
  const [confirmReload, setConfirmReload] = useState(false);

  function edit(patch: Partial<AlterationDossier>) {
    if (!editable) return;
    onChange({ ...dossier, ...patch });
  }

  return (
    <section className="panel excont">
      <div className="toolbar">
        <div className="tool-group">
          <span>Данные</span>
          <div className="row-actions">
            {editable && <button type="button" onClick={onSave}>СОХРАНИТЬ</button>}
            <button type="button" onClick={() => setConfirmReload(true)}>ПЕРЕЧИТАТЬ</button>
          </div>
        </div>
        {editable && (
          <div className="tool-group">
            <span>Работа</span>
            <button type="button" onClick={onSend}>НА УТВЕРЖДЕНИЕ</button>
          </div>
        )}
        <div className="tool-group">
          <span>Раздел</span>
          <div className="row-actions">
            <button type="button" aria-pressed={mode === "section"} onClick={() => setMode("section")}>СОДЕРЖАНИЕ</button>
            <button type="button" aria-pressed={mode === "letter"} onClick={() => setMode("letter")}>ПИСЬМО</button>
            <button type="button" aria-pressed={mode === "request"} onClick={() => setMode("request")}>Запросы</button>
          </div>
        </div>
      </div>
      {notice && <p className="notice inner-notice">{notice}</p>}
      <div className="excont-body">
        <nav className="content-tree" aria-label="Содержание работы">
          <ul>
            {tree.map((node) => (
              <li key={node.id}>
                <button type="button" onClick={() => setMode("plane")}>{node.caption}</button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="excont-main">
          {mode === "section" && (
            <article>
              <h2>Сведения о работе</h2>
              <div className="facts">
                <Fact label="Работа" value={alterationWorkCaption(work)} />
                <Fact label="Заказчик" value={work.clientName || "[нет наименования]"} />
                <Fact label="Заказ" value={work.orderNum || "[нет номера]"} />
                <Fact label="Эксперт" value="Эксперт (демо)" />
                <Fact label="Срок исполнения" value={formatDateTime(work.expertTerm)} />
                <Fact label="Руководитель" value={work.leaderName || "[нет данных]"} />
                <Fact label="Менеджер" value={work.managerName || "[нет данных]"} />
                <Fact label="Комментарии" value="[нет данных]" />
              </div>
              <h3>Перечень вновь представленных документов</h3>
              <ul className="plain-list">
                {dossier.documents.length === 0 && <li>[нет данных]</li>}
                {dossier.documents.map((doc) => <li key={doc.id}>{doc.caption}</li>)}
              </ul>
              <p className="row-actions">
                <button type="button" onClick={() => setMode("plane")}>ПЛАН МЕРОПРИЯТИЙ ПО РАБОТЕ</button>
              </p>
            </article>
          )}
          {mode === "plane" && <PlaneFields work={work} dossier={dossier} />}
          {mode === "letter" && (
            <article>
              <h2>Письмо</h2>
              <p className="lede">Проект письма. Редактор RTF из ProjectChildControl в этом срезе не переносится.</p>
              <textarea value={dossier.letter} disabled={!editable} onChange={(event) => edit({ letter: event.target.value })} />
            </article>
          )}
          {mode === "request" && (
            <article>
              <h2>Запросы</h2>
              {dossier.requests.length === 0 && <p>Запросов нет</p>}
              {editable && (
                <button
                  type="button"
                  onClick={() => edit({ requests: [...dossier.requests, { id: Date.now(), caption: `Запрос ${dossier.requests.length + 1}`, text: "" }] })}
                >
                  Создать
                </button>
              )}
              {dossier.requests.map((note) => (
                <div key={note.id} className="note">
                  <p>{note.caption}</p>
                  <textarea
                    value={note.text}
                    disabled={!editable}
                    onChange={(event) => edit({ requests: dossier.requests.map((item) => item.id === note.id ? { ...item, text: event.target.value } : item) })}
                  />
                  {editable && (
                    <button type="button" onClick={() => edit({ requests: dossier.requests.filter((item) => item.id !== note.id) })}>Удалить</button>
                  )}
                </div>
              ))}
            </article>
          )}
          <div className="actions">
            <button type="button" onClick={onClose}>Закрыть</button>
          </div>
        </div>
      </div>
      {confirmReload && (
        <div className="dialog-backdrop">
          <div className="dialog" role="alertdialog" aria-labelledby="reload-title">
            <h2 id="reload-title">Работа № {work.id}</h2>
            <p>Все несохраненные данные будут удалены. Продолжить?</p>
            <div className="row-actions">
              <button type="button" onClick={() => { setConfirmReload(false); onReload(); }}>Да</button>
              <button type="button" onClick={() => setConfirmReload(false)}>Нет</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PlaneFields({ work, dossier }: { work: Work; dossier: AlterationDossier }) {
  return (
    <article>
      <h2>План работы</h2>
      <div className="facts">
        <Fact label="Срок исполнения" value={formatDateTime(work.expertTerm)} />
        <Fact label="Трудоемкость (мин)" value={work.totalWork == null ? "" : String(work.totalWork)} />
        <Fact label="Решение по результатам рассмотрения" value={changeSummaryLabel(dossier.changeSummaryId)} />
      </div>
      <label className="stack">
        Резолюция руководителя
        <textarea value={dossier.leaderComment} disabled readOnly />
      </label>
      <label className="stack">
        Пояснения эксперта
        <textarea value={dossier.expertComment} disabled readOnly />
      </label>
      <label className="check">
        <input type="checkbox" checked={dossier.isSendQuery} disabled readOnly />
        Запрос дополнительной информации
      </label>
      <p className="lede">В состоянии «В работе» план только для чтения: правка открыта в состояниях плана.</p>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}
