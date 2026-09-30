import { useMemo, useState } from "react";
import type { Work } from "./domain.ts";
import { formatDateTime } from "./plan.ts";
import {
  buildLiconfirmTree,
  Content,
  FREE_WORK_SOURCE,
  GOOD_CATEGORIES,
  URGENCY,
  type CheckIssue,
  type LiconfirmDocument,
  type LiconfirmDossier,
  type LiconfirmGood,
} from "./liconfirm.ts";

interface LiconfirmCardProps {
  work: Work;
  dossier: LiconfirmDossier;
  onChange: (next: LiconfirmDossier) => void;
  onSave: () => void;
  onReload: () => void;
  onSend: () => void;
  onClose: () => void;
  onSign: () => void;
  issues: CheckIssue[];
  onCheck: () => void;
  notice: string | null;
}

type MainMode = "section" | "project" | "request";

export function LiconfirmCard({
  work,
  dossier,
  onChange,
  onSave,
  onReload,
  onSend,
  onClose,
  onSign,
  issues,
  onCheck,
  notice,
}: LiconfirmCardProps) {
  const editable = work.condition === "work";
  const projectVisible = work.condition !== "new";
  const tree = useMemo(() => buildLiconfirmTree(dossier), [dossier]);
  const [mode, setMode] = useState<MainMode>("section");
  const [contentId, setContentId] = useState<number>(Content.Content);
  const [objectId, setObjectId] = useState(0);
  const [treeOpen, setTreeOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [showIssues, setShowIssues] = useState(false);
  const [confirmReload, setConfirmReload] = useState(false);

  function edit(patch: Partial<LiconfirmDossier>) {
    if (!editable) return;
    const editsProject = Object.hasOwn(patch, "project1");
    const hasProject = dossier.project1.trim() !== "";
    onChange({
      ...dossier,
      ...patch,
      projectsStale: editsProject ? false : hasProject || dossier.projectsStale,
    });
  }

  function openNode(nextContentId: number, nextObjectId: number) {
    setMode("section");
    setContentId(nextContentId);
    setObjectId(nextObjectId);
  }

  const roots = tree.filter((node) => node.parentId == null);

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
            <div className="row-actions">
              <button type="button" onClick={() => { onCheck(); setShowIssues(true); }}>ПРОВЕРИТЬ</button>
              <button type="button" onClick={onSend}>НА УТВЕРЖДЕНИЕ</button>
            </div>
          </div>
        )}
        {work.condition === "signature" && (
          <div className="tool-group">
            <span>Работа</span>
            <button type="button" onClick={onSign}>ПОДПИСАТЬ</button>
          </div>
        )}
        <div className="tool-group">
          <span>Раздел</span>
          <div className="row-actions">
            <button type="button" aria-pressed={mode === "section" && contentId === Content.Content} onClick={() => openNode(Content.Content, 0)}>СОДЕРЖАНИЕ</button>
            {projectVisible && <button type="button" aria-pressed={mode === "project"} onClick={() => setMode("project")}>ПРОЕКТ #1</button>}
            <button type="button" aria-pressed={mode === "request"} onClick={() => setMode("request")}>Запросы</button>
          </div>
        </div>
      </div>
      {notice && <p className="notice inner-notice">{notice}</p>}
      <div className="excont-body">
        <nav className="content-tree" aria-label="Содержание работы">
          <div className="row-actions">
            <button type="button" onClick={() => setTreeOpen(true)}>Развернуть</button>
            <button type="button" onClick={() => setTreeOpen(false)}>Свернуть</button>
          </div>
          <ul>
            {roots.map((node) => (
              <TreeBranch
                key={`${node.id}-${node.contentId}`}
                node={node}
                nodes={tree}
                open={treeOpen}
                contentId={mode === "section" ? contentId : -1}
                objectId={objectId}
                onOpen={openNode}
              />
            ))}
          </ul>
        </nav>
        <div className="excont-main">
          {mode === "section" && contentId === Content.Content && (
            <article>
              <h2>Содержание</h2>
              <label className="stack">
                Поиск
                <input value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <label className="stack">
                Обобщенное наименование объектов экспертизы
                <input value={dossier.description} disabled={!editable} onChange={(event) => edit({ description: event.target.value })} />
              </label>
              <p className="row-actions">
                <button type="button" onClick={() => openNode(Content.ExtraDoc, 0)}>Перечень представленных документов</button>
                <button type="button" onClick={() => openNode(Content.License, 0)}>СВЕДЕНИЯ О ЛИЦЕНЗИИ</button>
                <button type="button" onClick={() => openNode(Content.GoodList, 0)}>ПРОДУКЦИЯ (ОБЪЕКТЫ ЭКСПЕРТИЗЫ)</button>
                <button type="button" onClick={() => openNode(Content.ExtraInfo, 0)}>ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ</button>
              </p>
              <ContentPreview dossier={dossier} query={query} />
            </article>
          )}
          {mode === "section" && contentId === Content.Plane && (
            <PlaneForm work={work} dossier={dossier} editable={editable} onEdit={edit} />
          )}
          {mode === "section" && contentId === Content.License && (
            <LicenseForm dossier={dossier} editable={editable} onEdit={edit} />
          )}
          {mode === "section" && contentId === Content.GoodList && (
            <GoodList dossier={dossier} editable={editable} onOpen={(id) => openNode(Content.GoodData, id)} onEdit={edit} />
          )}
          {mode === "section" && (contentId === Content.GoodData || contentId === Content.GoodLaw) && (
            <GoodForm
              dossier={dossier}
              good={dossier.goods.find((item) => item.id === objectId)}
              showLaw={contentId === Content.GoodLaw}
              editable={editable}
              onList={() => openNode(Content.GoodList, 0)}
              onData={() => setContentId(Content.GoodData)}
              onLaw={() => setContentId(Content.GoodLaw)}
              onChange={(good) => edit({ goods: dossier.goods.map((item) => item.id === good.id ? good : item) })}
            />
          )}
          {mode === "section" && contentId === Content.ExtraInfo && (
            <article>
              <h2>Дополнительная информация</h2>
              <label className="stack">
                Дополнительная информация, имеющая значение для целей экспортного контроля
                <textarea value={dossier.comment} disabled={!editable} onChange={(event) => edit({ comment: event.target.value })} />
              </label>
            </article>
          )}
          {mode === "section" && contentId === Content.ExtraDoc && (
            <DocForm dossier={dossier} editable={editable} onEdit={edit} />
          )}
          {mode === "project" && (
            <article>
              <h2>Проект #1</h2>
              <p className="lede">Текст проекта заключения. Редактор RTF из ProjectChildControl в этом срезе не переносится.</p>
              <textarea value={dossier.project1} disabled={!editable} onChange={(event) => edit({ project1: event.target.value })} />
            </article>
          )}
          {mode === "request" && (
            <RequestList notes={dossier.requests} editable={editable} onChange={(requests) => edit({ requests })} />
          )}
          <div className="actions">
            <button type="button" onClick={onClose}>Закрыть</button>
          </div>
        </div>
        {showIssues && (
          <aside className="issues" aria-label="Результаты проверки">
            <h2>Результаты проверки ({issues.length})</h2>
            {issues.length === 0 && <p>Ошибок нет.</p>}
            <ul>
              {issues.map((item, index) => (
                <li key={`${item.contentId}-${item.objectId}-${index}`}>
                  <button type="button" onClick={() => openNode(item.contentId, item.objectId)}>
                    <small>{item.place}</small>
                    {item.description}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
      {dossier.projectsStale && <p className="lede slim">Данные изменены после создания проекта заключения.</p>}
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

function TreeBranch({
  node,
  nodes,
  open,
  contentId,
  objectId,
  onOpen,
}: {
  node: ReturnType<typeof buildLiconfirmTree>[number];
  nodes: ReturnType<typeof buildLiconfirmTree>;
  open: boolean;
  contentId: number;
  objectId: number;
  onOpen: (contentId: number, objectId: number) => void;
}) {
  const children = nodes.filter((item) => item.parentId === node.id);
  const active = contentId === node.contentId && objectId === node.objectId;
  return (
    <li>
      <button type="button" aria-current={active ? "true" : undefined} onClick={() => onOpen(node.contentId, node.objectId)}>
        {node.caption}
      </button>
      {open && children.length > 0 && (
        <ul>
          {children.map((child) => (
            <TreeBranch key={`${child.id}-${child.contentId}`} node={child} nodes={nodes} open={open} contentId={contentId} objectId={objectId} onOpen={onOpen} />
          ))}
        </ul>
      )}
    </li>
  );
}

function ContentPreview({ dossier, query }: { dossier: LiconfirmDossier; query: string }) {
  const license = dossier.licenses.find((item) => item.id === dossier.licId);
  const blocks = [
    dossier.description,
    license ? `Лицензия: ${license.regNumCaption}. ${license.description}` : "",
    ...dossier.goods.map((good) => `Объект ${good.rowNum}: ${good.nameCon}. ТН ВЭД ${good.tnved}. ${good.goodDescription}`),
    dossier.comment,
  ].filter((block) => block.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="preview">
      {blocks.map((block) => <p key={block}>{block}</p>)}
      {blocks.length === 0 && <p>В содержании ничего не найдено.</p>}
    </div>
  );
}

function PlaneForm({
  work,
  dossier,
  editable,
  onEdit,
}: {
  work: Work;
  dossier: LiconfirmDossier;
  editable: boolean;
  onEdit: (patch: Partial<LiconfirmDossier>) => void;
}) {
  return (
    <article>
      <h2>План работы</h2>
      <dl className="facts">
        <Fact label="Вид работы" value="Контр." />
        <Fact label="Срок исполнения" value={formatDateTime(work.expertTerm)} />
        <Fact label="Общая трудоемкость (мин.)" value={work.totalWork == null ? "" : String(work.totalWork)} />
        <Fact label="Количество товаров по спецификации" value={String(work.goodCount)} />
      </dl>
      <div className="facts">
        <Field label="Количество материальных объектов исследования" value={String(dossier.matCount)} disabled={!editable} onChange={(value) => onEdit({ matCount: Number(value) || 0 })} />
        <Field label="Количество информационных объектов исследования" value={String(dossier.infCount)} disabled={!editable} onChange={(value) => onEdit({ infCount: Number(value) || 0 })} />
        <Field label="Количество дополнительных стран / направлений перемещения" value={String(dossier.addWorkCount)} disabled={!editable} onChange={(value) => onEdit({ addWorkCount: Number(value) || 0 })} />
        <Field label="Количество документов на иностранном языке" value={String(dossier.langCount)} disabled={!editable} onChange={(value) => onEdit({ langCount: Number(value) || 0 })} />
      </div>
      <label className="stack">
        Срочность
        <select value={dossier.urgencyId} disabled={!editable} onChange={(event) => onEdit({ urgencyId: Number(event.target.value) })}>
          {URGENCY.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <Field label="Коэффициент за сложность" value={dossier.complexity} disabled={!editable} onChange={(complexity) => onEdit({ complexity })} />
      <label className="check">
        <input
          type="checkbox"
          checked={dossier.changeSourceId === FREE_WORK_SOURCE}
          disabled={!editable}
          onChange={(event) => onEdit({ changeSourceId: event.target.checked ? FREE_WORK_SOURCE : 0 })}
        />
        Без оплаты
      </label>
      <label className="check">
        <input type="checkbox" checked={dossier.isSendQuery} disabled={!editable} onChange={(event) => onEdit({ isSendQuery: event.target.checked })} />
        Запрос дополнительной информации
      </label>
      <label className="check">
        <input type="checkbox" checked={dossier.isMakeProfile} disabled={!editable} onChange={(event) => onEdit({ isMakeProfile: event.target.checked })} />
        Составление профилей иностранных участников
      </label>
      <label className="stack">
        Пояснения к плану работ
        <textarea value={dossier.planeComment} disabled={!editable} onChange={(event) => onEdit({ planeComment: event.target.value })} />
      </label>
    </article>
  );
}

function LicenseForm({
  dossier,
  editable,
  onEdit,
}: {
  dossier: LiconfirmDossier;
  editable: boolean;
  onEdit: (patch: Partial<LiconfirmDossier>) => void;
}) {
  const selected = dossier.licenses.find((item) => item.id === dossier.licId) ?? dossier.licenses[0];
  return (
    <article>
      <h2>Сведения о лицензии</h2>
      {dossier.licenses.length === 0 && <p>[нет данных]</p>}
      <ul className="plain-list">
        {dossier.licenses.map((license) => (
          <li key={license.id}>
            <span>{license.regNumCaption}</span>
            {editable && (
              <button
                type="button"
                onClick={() => onEdit({ licId: dossier.licId === license.id ? null : license.id })}
              >
                {dossier.licId === license.id ? "Убрать из выборки" : "Выбрать"}
              </button>
            )}
            {dossier.licId === license.id && <small>Выбрано</small>}
          </li>
        ))}
      </ul>
      {selected && (
        <dl className="facts">
          <Fact label="Предмет внешнеэкономической операции" value={selected.description} />
          <Fact label="Документ-основание операции" value={selected.contractName} />
          <Fact label="Страна назначения" value={selected.countryName} />
          <Fact label="Российский участник операции" value={selected.rusName} />
          <Fact label="Иностранный покупатель" value={selected.nusName} />
          <Fact label="Потребитель (конечный пользователь)" value={selected.endName} />
        </dl>
      )}
    </article>
  );
}

function GoodList({
  dossier,
  editable,
  onOpen,
  onEdit,
}: {
  dossier: LiconfirmDossier;
  editable: boolean;
  onOpen: (id: number) => void;
  onEdit: (patch: Partial<LiconfirmDossier>) => void;
}) {
  return (
    <article>
      <h2>Продукция</h2>
      <h3>Общие сведения об объектах экспертизы</h3>
      <label className="stack">
        Область применения объектов экспертизы
        <textarea value={dossier.goodArea} disabled={!editable} onChange={(event) => onEdit({ goodArea: event.target.value })} />
      </label>
      <label className="stack">
        Назначение объектов экспертизы
        <textarea value={dossier.goodUsed} disabled={!editable} onChange={(event) => onEdit({ goodUsed: event.target.value })} />
      </label>
      {editable && (
        <button
          type="button"
          onClick={() => {
            const rowNum = dossier.goods.reduce((max, good) => Math.max(max, good.rowNum), 0) + 1;
            const good: LiconfirmGood = {
              id: Date.now(),
              rowNum,
              nameCon: "",
              nameDec: "",
              isNotDec: false,
              typeId: null,
              tnved: "",
              cas: "",
              tnvedComment: "",
              area: "",
              used: "",
              description: "",
              goodDescription: "",
              appendIds: [],
            };
            onEdit({ goods: [...dossier.goods, good] });
          }}
        >
          Добавить
        </button>
      )}
      {dossier.goods.length === 0 && <p>Объектов экспертизы нет.</p>}
      <ul className="plain-list">
        {dossier.goods.map((good) => (
          <li key={good.id}>
            <button type="button" onClick={() => onOpen(good.id)}>
              {good.rowNum}. {good.nameCon || "[нет наименования]"}
            </button>
            {editable && (
              <button type="button" onClick={() => onEdit({ goods: dossier.goods.filter((item) => item.id !== good.id) })}>
                Удалить
              </button>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}

function GoodForm({
  dossier,
  good,
  showLaw,
  editable,
  onList,
  onData,
  onLaw,
  onChange,
}: {
  dossier: LiconfirmDossier;
  good: LiconfirmGood | undefined;
  showLaw: boolean;
  editable: boolean;
  onList: () => void;
  onData: () => void;
  onLaw: () => void;
  onChange: (good: LiconfirmGood) => void;
}) {
  const [find, setFind] = useState("");
  if (!good) return <article><h2>Регистрационные данные</h2><p>Объект не найден.</p></article>;
  const patch = (part: Partial<LiconfirmGood>) => onChange({ ...good, ...part });
  const appends = dossier.appends
    .filter((item) => item.licId === dossier.licId)
    .filter((item) => `${item.pos} ${item.stage} ${item.description}`.toLowerCase().includes(find.trim().toLowerCase()));
  return (
    <article>
      <h2>Продукция &gt; Объект № {good.rowNum}</h2>
      <div className="row-actions">
        <button type="button" onClick={onList}>Список</button>
        <button type="button" aria-pressed={!showLaw} onClick={onData}>РЕГИСТРАЦИОННЫЕ ДАННЫЕ</button>
        <button type="button" aria-pressed={showLaw} onClick={onLaw}>ПРОВЕРКА СООТВЕТСТВИЯ</button>
      </div>
      {!showLaw && (
        <>
          <Field label="Коммерческое наименование" value={good.nameCon} disabled={!editable} onChange={(nameCon) => patch({ nameCon })} />
          <Field label="Обозначение" value={good.nameDec} disabled={!editable || good.isNotDec} onChange={(nameDec) => patch({ nameDec })} />
          <label className="check">
            <input type="checkbox" checked={good.isNotDec} disabled={!editable} onChange={(event) => patch({ isNotDec: event.target.checked })} />
            Обозначение отсутствует
          </label>
          <label className="stack">
            Категория
            <select
              value={good.typeId ?? ""}
              disabled={!editable}
              onChange={(event) => patch({ typeId: event.target.value ? Number(event.target.value) : null })}
            >
              <option value="">—</option>
              {GOOD_CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.codeName}</option>)}
            </select>
          </label>
          <Field label="Код ТН ВЭД" value={good.tnved} disabled={!editable} onChange={(tnved) => patch({ tnved })} />
          <Field label="Номер CAS" value={good.cas} disabled={!editable} onChange={(cas) => patch({ cas })} />
          <label className="stack">
            Обоснование кода ТН ВЭД
            <textarea value={good.tnvedComment} disabled={!editable} onChange={(event) => patch({ tnvedComment: event.target.value })} />
          </label>
          <label className="stack">
            Область применения
            <textarea value={good.area} disabled={!editable} onChange={(event) => patch({ area: event.target.value })} />
          </label>
          <label className="stack">
            Назначение
            <textarea value={good.used} disabled={!editable} onChange={(event) => patch({ used: event.target.value })} />
          </label>
          <label className="stack">
            Техническое описание
            <textarea value={good.description} disabled={!editable} onChange={(event) => patch({ description: event.target.value })} />
          </label>
        </>
      )}
      {showLaw && (
        <>
          <h3>Приложения к лицензии</h3>
          {dossier.licId == null && <p>Не выбрана лицензия</p>}
          <label className="stack">
            Поиск
            <input value={find} onChange={(event) => setFind(event.target.value)} />
          </label>
          {appends.length === 0 && dossier.licId != null && <p>Пунктов приложения нет.</p>}
          <ul className="plain-list">
            {appends.map((item) => {
              const checked = good.appendIds.includes(item.id);
              return (
                <li key={item.id}>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={!editable}
                      onChange={() => patch({
                        appendIds: checked ? good.appendIds.filter((id) => id !== item.id) : [...good.appendIds, item.id],
                      })}
                    />
                    {item.pos}. {item.stage}. {item.description}
                  </label>
                </li>
              );
            })}
          </ul>
          <label className="stack">
            Технические характеристики для сравнения с выбранным пунктом
            <textarea value={good.goodDescription} disabled={!editable} onChange={(event) => patch({ goodDescription: event.target.value })} />
          </label>
        </>
      )}
    </article>
  );
}

function DocForm({ dossier, editable, onEdit }: { dossier: LiconfirmDossier; editable: boolean; onEdit: (patch: Partial<LiconfirmDossier>) => void }) {
  function update(doc: LiconfirmDocument) {
    onEdit({ documents: dossier.documents.map((item) => item.id === doc.id ? doc : item) });
  }
  return (
    <article>
      <h2>Перечень документов</h2>
      <label className="check">
        <input type="checkbox" checked={dossier.isDocRule} disabled={!editable} onChange={(event) => onEdit({ isDocRule: event.target.checked })} />
        Провоспособность удостоверяю
      </label>
      {editable && (
        <button
          type="button"
          onClick={() => onEdit({
            documents: [...dossier.documents, { id: Date.now(), rowNum: dossier.documents.length + 1, caption: "", regNum: "", regDate: "", used: true }],
          })}
        >
          Добавить
        </button>
      )}
      {dossier.documents.map((doc) => (
        <div key={doc.id} className="note">
          <Field label="Наименование или краткое содержание" value={doc.caption} disabled={!editable} onChange={(caption) => update({ ...doc, caption })} />
          <Field label="Номер" value={doc.regNum} disabled={!editable} onChange={(regNum) => update({ ...doc, regNum })} />
          <Field label="Дата" value={doc.regDate} type="date" disabled={!editable} onChange={(regDate) => update({ ...doc, regDate })} />
          <label className="check">
            <input type="checkbox" checked={doc.used} disabled={!editable} onChange={(event) => update({ ...doc, used: event.target.checked })} />
            Использован
          </label>
          {editable && <button type="button" onClick={() => onEdit({ documents: dossier.documents.filter((item) => item.id !== doc.id) })}>Удалить</button>}
        </div>
      ))}
    </article>
  );
}

function RequestList({
  notes,
  editable,
  onChange,
}: {
  notes: LiconfirmDossier["requests"];
  editable: boolean;
  onChange: (notes: LiconfirmDossier["requests"]) => void;
}) {
  return (
    <article>
      <h2>Запросы</h2>
      {notes.length === 0 && <p>Запросов нет</p>}
      {editable && (
        <button type="button" onClick={() => onChange([...notes, { id: Date.now(), caption: `Запрос ${notes.length + 1}`, text: "" }])}>
          Создать
        </button>
      )}
      {notes.map((note) => (
        <div key={note.id} className="note">
          <Field label="Наименование" value={note.caption} disabled={!editable} onChange={(caption) => onChange(notes.map((item) => item.id === note.id ? { ...item, caption } : item))} />
          <textarea value={note.text} disabled={!editable} onChange={(event) => onChange(notes.map((item) => item.id === note.id ? { ...item, text: event.target.value } : item))} />
          {editable && <button type="button" onClick={() => onChange(notes.filter((item) => item.id !== note.id))}>Удалить</button>}
        </div>
      ))}
    </article>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = "text",
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled: boolean;
  type?: string;
}) {
  return (
    <label className="stack">
      {label}
      <input type={type} value={value} disabled={disabled} onChange={(event) => onChange?.(event.target.value)} />
    </label>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="field">
      <span>{label}</span>
      <p>{value || "—"}</p>
    </div>
  );
}
