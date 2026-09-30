import { useState } from "react";
import type { Work } from "./domain.ts";
import { formatDateTime } from "./plan.ts";
import {
  ORDER_ACCEPT_QUESTION,
  ORDER_EXPERTS,
  ORDER_MANAGERS,
  ORDER_WORK_TYPES,
  orderAcceptWarning,
  orderWorkCaption,
  type OrderDossier,
  type OrderService,
} from "./orderWork.ts";

interface OrderWorkCardProps {
  work: Work;
  dossier: OrderDossier;
  notice: string | null;
  onChange: (next: OrderDossier) => void;
  onAccept: () => void;
  onToggleStop: () => void;
  onReturn: (comment: string) => void;
  onHistory: () => void;
  onClose: () => void;
}

export function OrderWorkCard({
  work,
  dossier,
  notice,
  onChange,
  onAccept,
  onToggleStop,
  onReturn,
  onHistory,
  onClose,
}: OrderWorkCardProps) {
  const locked = work.condition === "close" || work.condition === "cancel";
  const [draftType, setDraftType] = useState<number | "">("");
  const [draftExpert, setDraftExpert] = useState<number | "">("");
  const [draftManager, setDraftManager] = useState<number | "">("");
  const [askAccept, setAskAccept] = useState(false);
  const [askReturn, setAskReturn] = useState(false);
  const [returnComment, setReturnComment] = useState("");
  const [warning, setWarning] = useState<string | null>(null);

  function update(services: OrderService[]) {
    onChange({ ...dossier, services });
  }

  function addDraft() {
    if (locked || draftType === "") return;
    update([
      ...dossier.services,
      {
        id: Date.now(),
        typeId: draftType,
        expertId: draftExpert === "" ? null : draftExpert,
        managerId: draftManager === "" ? null : draftManager,
      },
    ]);
    setDraftType("");
    setDraftExpert("");
    setDraftManager("");
  }

  function tryAccept() {
    const found = orderAcceptWarning(dossier.services);
    if (found) {
      setWarning(found);
      return;
    }
    setWarning(null);
    setAskAccept(true);
  }

  return (
    <section className="panel excont">
      <div className="toolbar">
        <div className="tool-group">
          <span>Работа</span>
          <div className="row-actions">
            <button type="button" disabled={locked} onClick={tryAccept}>УТВЕРДИТЬ</button>
            <button type="button" disabled={locked} onClick={onToggleStop}>СТОП</button>
            <button type="button" onClick={onHistory}>ИСТОРИЯ</button>
            <button type="button" disabled={locked} onClick={() => { setReturnComment(""); setAskReturn(true); }}>ВОЗВРАТ</button>
          </div>
        </div>
      </div>
      {(notice || warning) && <p className="notice inner-notice">{warning ?? notice}</p>}
      <div className="excont-body">
        <article className="content-tree">
          <h2>Сведения о работе</h2>
          <div className="facts">
            <Fact label="Работа" value={orderWorkCaption(work)} />
            <Fact label="Заказчик" value={work.clientName || "[нет наименования]"} />
            <Fact label="Заказ" value={work.orderNum || "[нет номера]"} />
            <Fact label="Срок исполнения" value={formatDateTime(work.expertTerm)} />
            <Fact label="Руководитель" value={work.leaderName || "[нет данных]"} />
            <Fact label="Менеджер" value={work.managerName || "[нет данных]"} />
            <Fact label="Комментарии" value="[нет данных]" />
          </div>
          <h3>Перечень представленных документов</h3>
          <ul className="plain-list">
            {dossier.documents.length === 0 && <li>[нет данных]</li>}
            {dossier.documents.map((doc) => <li key={doc.id}>{doc.caption}</li>)}
          </ul>
        </article>
        <div className="excont-main">
          <article>
            <h2>Выбор работ для исполнения заказа</h2>
            <p>ВЫбот видов услуг для исполнения заказа:</p>
            <table>
              <thead>
                <tr>
                  <th>Вид работы</th>
                  <th>Эксперт</th>
                  <th>Менеджер</th>
                </tr>
              </thead>
              <tbody>
                {dossier.services.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <select
                        aria-label="Вид работы"
                        value={row.typeId ?? ""}
                        disabled={locked}
                        onChange={(event) => update(dossier.services.map((item) => item.id === row.id
                          ? { ...item, typeId: event.target.value === "" ? null : Number(event.target.value) }
                          : item))}
                      >
                        <option value=""> </option>
                        {ORDER_WORK_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                      </select>
                      {!locked && (
                        <button type="button" onClick={() => update(dossier.services.filter((item) => item.id !== row.id))}>Удалить</button>
                      )}
                    </td>
                    <td>
                      <select
                        aria-label="Эксперт"
                        value={row.expertId ?? ""}
                        disabled={locked}
                        onChange={(event) => update(dossier.services.map((item) => item.id === row.id
                          ? { ...item, expertId: event.target.value === "" ? null : Number(event.target.value) }
                          : item))}
                      >
                        <option value=""> </option>
                        {ORDER_EXPERTS.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                      </select>
                      {!locked && (
                        <button type="button" onClick={() => update(dossier.services.map((item) => item.id === row.id ? { ...item, expertId: null } : item))}>Очистить</button>
                      )}
                    </td>
                    <td>
                      <select
                        aria-label="Менеджер"
                        value={row.managerId ?? ""}
                        disabled={locked}
                        onChange={(event) => update(dossier.services.map((item) => item.id === row.id
                          ? { ...item, managerId: event.target.value === "" ? null : Number(event.target.value) }
                          : item))}
                      >
                        <option value=""> </option>
                        {ORDER_MANAGERS.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                      </select>
                      {!locked && (
                        <button type="button" onClick={() => update(dossier.services.map((item) => item.id === row.id ? { ...item, managerId: null } : item))}>Очистить</button>
                      )}
                    </td>
                  </tr>
                ))}
                {!locked && (
                  <tr>
                    <td>
                      <select aria-label="Вид новой работы" value={draftType} onChange={(event) => setDraftType(event.target.value === "" ? "" : Number(event.target.value))}>
                        <option value=""> </option>
                        {ORDER_WORK_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <select aria-label="Эксперт новой работы" value={draftExpert} onChange={(event) => setDraftExpert(event.target.value === "" ? "" : Number(event.target.value))}>
                        <option value=""> </option>
                        {ORDER_EXPERTS.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                      </select>
                    </td>
                    <td>
                      <select aria-label="Менеджер новой работы" value={draftManager} onChange={(event) => setDraftManager(event.target.value === "" ? "" : Number(event.target.value))}>
                        <option value=""> </option>
                        {ORDER_MANAGERS.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
                      </select>
                      <button type="button" onClick={addDraft}>Добавить</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <label className="stack">
              Указания исполнителям по выбранной услуге:
              <textarea
                value={dossier.instruction}
                disabled={locked}
                onChange={(event) => onChange({ ...dossier, instruction: event.target.value })}
              />
            </label>
          </article>
          <div className="actions">
            <button type="button" onClick={onClose}>Закрыть</button>
          </div>
        </div>
      </div>
      {askAccept && (
        <div className="dialog-backdrop">
          <div className="dialog" role="alertdialog" aria-labelledby="order-accept-title">
            <h2 id="order-accept-title">Работа № {work.id}</h2>
            <p>{ORDER_ACCEPT_QUESTION}</p>
            <div className="row-actions">
              <button type="button" onClick={() => { setAskAccept(false); onAccept(); }}>Да</button>
              <button type="button" onClick={() => setAskAccept(false)}>Нет</button>
            </div>
          </div>
        </div>
      )}
      {askReturn && (
        <div className="dialog-backdrop">
          <div className="dialog" role="dialog" aria-labelledby="order-return-title">
            <h2 id="order-return-title">Возврат на доработку</h2>
            <p>Укажите причину возврата</p>
            <label className="stack">
              Комментарий
              <textarea value={returnComment} onChange={(event) => setReturnComment(event.target.value)} />
            </label>
            <div className="row-actions">
              <button type="button" onClick={() => { setAskReturn(false); onReturn(returnComment); }}>ВОЗВРАТ</button>
              <button type="button" onClick={() => setAskReturn(false)}>ОТМЕНА</button>
            </div>
          </div>
        </div>
      )}
    </section>
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
