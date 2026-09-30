import { useMemo, useState } from "react";
import type { Work } from "./domain.ts";
import { formatDateTime } from "./plan.ts";
import {
  buildMilitaryTree,
  Content,
  FREE_WORK_SOURCE,
  GOOD_TYPES,
  URGENCY,
  type CheckIssue,
  type CivilDoc,
  type MilitaryDocument,
  type MilitaryDossier,
  type MilitaryGood,
  type MilitaryMember,
} from "./military.ts";

interface MilitaryCardProps {
  work: Work;
  dossier: MilitaryDossier;
  onChange: (next: MilitaryDossier) => void;
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

export function MilitaryCard({
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
}: MilitaryCardProps) {
  const editable = work.condition === "work";
  const projectVisible = work.condition !== "new";
  const tree = useMemo(() => buildMilitaryTree(dossier), [dossier]);
  const [mode, setMode] = useState<MainMode>("section");
  const [contentId, setContentId] = useState<number>(Content.Content);
  const [objectId, setObjectId] = useState(0);
  const [treeOpen, setTreeOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [showIssues, setShowIssues] = useState(false);
  const [confirmReload, setConfirmReload] = useState(false);

  function edit(patch: Partial<MilitaryDossier>) {
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

  const good = dossier.goods.find((item) => item.id === objectId);
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
                <button type="button" onClick={() => openNode(Content.SupplyRusData, 0)}>РОССИЙСКИЙ УЧАСТНИК</button>
                <button type="button" onClick={() => openNode(Content.GoodList, 0)}>ПРОДУКЦИЯ (ОБЪЕКТЫ ЭКСПЕРТИЗЫ)</button>
                <button type="button" onClick={() => openNode(Content.Summary, 0)}>РЕШЕНИЕ ПО АНАЛИЗУ</button>
              </p>
              <ContentPreview dossier={dossier} query={query} />
            </article>
          )}
          {mode === "section" && contentId === Content.Plane && (
            <PlaneForm work={work} dossier={dossier} editable={editable} onEdit={edit} />
          )}
          {mode === "section" && contentId === Content.SupplyRusData && (
            <MemberForm dossier={dossier} editable={editable} onEdit={edit} />
          )}
          {mode === "section" && contentId === Content.GoodList && (
            <GoodList dossier={dossier} editable={editable} onOpen={(id) => openNode(Content.GoodData, id)} onEdit={edit} />
          )}
          {mode === "section" && contentId === Content.GoodData && (
            <GoodData
              item={good}
              editable={editable}
              onList={() => openNode(Content.GoodList, 0)}
              onLaw={() => good && openNode(Content.GoodLaw, good.id)}
              onAnalysis={() => good && openNode(Content.GoodSummary, good.id)}
              onChange={(item) => edit({ goods: dossier.goods.map((row) => row.id === item.id ? item : row) })}
            />
          )}
          {mode === "section" && contentId === Content.GoodLaw && (
            <GoodLaw
              item={good}
              editable={editable}
              onList={() => openNode(Content.GoodList, 0)}
              onData={() => good && openNode(Content.GoodData, good.id)}
              onAnalysis={() => good && openNode(Content.GoodSummary, good.id)}
              onChange={(item) => edit({ goods: dossier.goods.map((row) => row.id === item.id ? item : row) })}
            />
          )}
          {mode === "section" && contentId === Content.GoodSummary && (
            <GoodAnalysis
              item={good}
              editable={editable}
              onList={() => openNode(Content.GoodList, 0)}
              onData={() => good && openNode(Content.GoodData, good.id)}
              onLaw={() => good && openNode(Content.GoodLaw, good.id)}
              onChange={(item) => edit({ goods: dossier.goods.map((row) => row.id === item.id ? item : row) })}
            />
          )}
          {mode === "section" && contentId === Content.Summary && (
            <DecisionForm dossier={dossier} editable={editable} onEdit={edit} />
          )}
          {mode === "section" && contentId === Content.ExtraDoc && (
            <DocForm dossier={dossier} editable={editable} onEdit={edit} />
          )}
          {mode === "project" && (
            <article>
              <h2>Проект #1</h2>
              <p className="lede">Текст проекта заключения. Редактор RTF из ProjectChildControl в этом срезе не переносится. Кнопка «ПРОЕКТ #2» в источнике скрыта.</p>
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
  node: ReturnType<typeof buildMilitaryTree>[number];
  nodes: ReturnType<typeof buildMilitaryTree>;
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

function ContentPreview({ dossier, query }: { dossier: MilitaryDossier; query: string }) {
  const blocks = [
    dossier.description,
    dossier.member?.nameLong ?? "",
    dossier.contractCaption,
    ...dossier.goods.map((item) => `${item.nameCon} ${item.nameDec} ${item.tnved}`),
    dossier.summary,
    dossier.comment,
  ].filter((line) => line.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <ul className="plain-list">
      {blocks.map((line) => <li key={line}>{line}</li>)}
    </ul>
  );
}

function PlaneForm({
  work,
  dossier,
  editable,
  onEdit,
}: {
  work: Work;
  dossier: MilitaryDossier;
  editable: boolean;
  onEdit: (patch: Partial<MilitaryDossier>) => void;
}) {
  return (
    <article>
      <h2>План работы</h2>
      <div className="facts">
        <Fact label="Вид работы" value="Граж." />
        <Fact label="Срок исполнения" value={formatDateTime(work.expertTerm)} />
        <Fact label="Общая трудоемкость (мин.)" value={work.totalWork == null ? "" : String(work.totalWork)} />
        <Fact label="Количество товаров по спецификации" value={String(work.goodCount)} />
      </div>
      <div className="grid">
        <Field label="Количество материальных объектов исследования" value={String(dossier.matCount)} disabled={!editable} onChange={(value) => onEdit({ matCount: Number(value) || 0 })} />
        <Field label="Количество информационных объектов исследования" value={String(dossier.infCount)} disabled={!editable} onChange={(value) => onEdit({ infCount: Number(value) || 0 })} />
        <Field label="Количество дополнительных стран / направлений перемещения" value={String(dossier.addWorkCount)} disabled={!editable} onChange={(value) => onEdit({ addWorkCount: Number(value) || 0 })} />
        <Field label="Количество документов на иностранном языке" value={String(dossier.langCount)} disabled={!editable} onChange={(value) => onEdit({ langCount: Number(value) || 0 })} />
        <label className="stack">
          Срочность
          <select value={dossier.urgencyId} disabled={!editable} onChange={(event) => onEdit({ urgencyId: Number(event.target.value) })}>
            {URGENCY.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <Field label="Коэффициент за сложность" value={dossier.complexity} disabled={!editable} onChange={(complexity) => onEdit({ complexity })} />
      </div>
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

function MemberForm({
  dossier,
  editable,
  onEdit,
}: {
  dossier: MilitaryDossier;
  editable: boolean;
  onEdit: (patch: Partial<MilitaryDossier>) => void;
}) {
  const member = dossier.member;
  function patch(next: Partial<MilitaryMember>) {
    if (!member) return;
    onEdit({ member: { ...member, ...next } });
  }
  return (
    <article>
      <h2>Российский участник внешнеэкономической операции</h2>
      {!member && <p>Российский участник не указан.</p>}
      {editable && !member && (
        <button
          type="button"
          onClick={() => onEdit({
            member: {
              id: 1,
              nameLong: "",
              nameShort: "",
              kind: "",
              inn: "",
              kpp: "",
              addressLegalFull: "",
              addressLegalCountry: "",
              addressLegalTown: "",
            },
          })}
        >
          Добавить
        </button>
      )}
      {member && (
        <div className="grid">
          <Field label="Полное наименование" value={member.nameLong} disabled={!editable} onChange={(nameLong) => patch({ nameLong })} />
          <Field label="Краткое наименование" value={member.nameShort} disabled={!editable} onChange={(nameShort) => patch({ nameShort })} />
          <Field label="Вид" value={member.kind} disabled={!editable} onChange={(kind) => patch({ kind })} />
          <Field label="ИНН" value={member.inn} disabled={!editable} onChange={(inn) => patch({ inn })} />
          <Field label="КПП" value={member.kpp} disabled={!editable} onChange={(kpp) => patch({ kpp })} />
          <Field label="Юридический адрес" value={member.addressLegalFull} disabled={!editable} onChange={(addressLegalFull) => patch({ addressLegalFull })} />
          <Field label="Страна" value={member.addressLegalCountry} disabled={!editable} onChange={(addressLegalCountry) => patch({ addressLegalCountry })} />
          <Field label="Город (населенный пункт)" value={member.addressLegalTown} disabled={!editable} onChange={(addressLegalTown) => patch({ addressLegalTown })} />
        </div>
      )}
      <label className="stack">
        Документ-основание внешнеэкономической операции
        <input
          value={dossier.contractCaption}
          disabled={!editable}
          placeholder="Наименование и реквизиты документа-основания внешнеэкономической операции"
          onChange={(event) => onEdit({ contractCaption: event.target.value })}
        />
      </label>
    </article>
  );
}

function GoodList({
  dossier,
  editable,
  onOpen,
  onEdit,
}: {
  dossier: MilitaryDossier;
  editable: boolean;
  onOpen: (id: number) => void;
  onEdit: (patch: Partial<MilitaryDossier>) => void;
}) {
  return (
    <article>
      <h2>Продукция</h2>
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
            const rowNum = dossier.goods.reduce((max, item) => Math.max(max, item.rowNum), 0) + 1;
            const item: MilitaryGood = {
              id: Date.now(),
              rowNum,
              nameCon: "",
              nameDec: "",
              isNotDec: false,
              typeId: null,
              tnved: "",
              cas: "",
              area: "",
              used: "",
              description: "",
              summary: "",
              civilDocs: [],
              lawPoints: [],
            };
            onEdit({ goods: [...dossier.goods, item] });
          }}
        >
          Добавить
        </button>
      )}
      <ul className="plain-list">
        {dossier.goods.map((item) => (
          <li key={item.id}>
            <button type="button" onClick={() => onOpen(item.id)}>
              {item.rowNum}. {item.nameCon || "[нет наименования]"}
            </button>
            {editable && (
              <button type="button" onClick={() => onEdit({ goods: dossier.goods.filter((row) => row.id !== item.id) })}>
                Удалить
              </button>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}

function GoodNav({
  onList,
  onData,
  onLaw,
  onAnalysis,
}: {
  onList: () => void;
  onData?: () => void;
  onLaw?: () => void;
  onAnalysis?: () => void;
}) {
  return (
    <div className="row-actions">
      <button type="button" onClick={onList}>Список</button>
      {onData && <button type="button" onClick={onData}>РЕГИСТРАЦИОННЫЕ ДАННЫЕ</button>}
      {onLaw && <button type="button" onClick={onLaw}>КЛАССИФИКАТОР ПВН</button>}
      {onAnalysis && <button type="button" onClick={onAnalysis}>АНАЛИЗ</button>}
    </div>
  );
}

function GoodData({
  item,
  editable,
  onList,
  onLaw,
  onAnalysis,
  onChange,
}: {
  item: MilitaryGood | undefined;
  editable: boolean;
  onList: () => void;
  onLaw: () => void;
  onAnalysis: () => void;
  onChange: (item: MilitaryGood) => void;
}) {
  if (!item) return <article><h2>Объект</h2><p>Объект не найден.</p></article>;
  return (
    <article>
      <h2>Продукция &gt; Объект № {item.rowNum} &gt; Регистрационные данные</h2>
      <GoodNav onList={onList} onLaw={onLaw} onAnalysis={onAnalysis} />
      <div className="grid">
        <Field label="Коммерческое наименование" value={item.nameCon} disabled={!editable} onChange={(nameCon) => onChange({ ...item, nameCon })} />
        <Field label="Обозначение" value={item.nameDec} disabled={!editable || item.isNotDec} onChange={(nameDec) => onChange({ ...item, nameDec })} />
        <label className="check">
          <input type="checkbox" checked={item.isNotDec} disabled={!editable} onChange={(event) => onChange({ ...item, isNotDec: event.target.checked })} />
          Обозначение отсутствует
        </label>
        <label className="stack">
          Вид объекта
          <select
            value={item.typeId ?? ""}
            disabled={!editable}
            onChange={(event) => onChange({ ...item, typeId: event.target.value === "" ? null : Number(event.target.value) })}
          >
            <option value=""> </option>
            {GOOD_TYPES.map((type) => <option key={type.id} value={type.id}>{type.codeName}</option>)}
          </select>
        </label>
        <Field label="Код ТН ВЭД" value={item.tnved} disabled={!editable} onChange={(tnved) => onChange({ ...item, tnved })} />
        <Field label="Номер CAS" value={item.cas} disabled={!editable} onChange={(cas) => onChange({ ...item, cas })} />
      </div>
      <label className="stack">
        Область применения
        <textarea value={item.area} disabled={!editable} onChange={(event) => onChange({ ...item, area: event.target.value })} />
      </label>
      <label className="stack">
        Назначение
        <textarea value={item.used} disabled={!editable} onChange={(event) => onChange({ ...item, used: event.target.value })} />
      </label>
      <label className="stack">
        Техническое описание
        <textarea value={item.description} disabled={!editable} onChange={(event) => onChange({ ...item, description: event.target.value })} />
      </label>
    </article>
  );
}

function GoodLaw({
  item,
  editable,
  onList,
  onData,
  onAnalysis,
  onChange,
}: {
  item: MilitaryGood | undefined;
  editable: boolean;
  onList: () => void;
  onData: () => void;
  onAnalysis: () => void;
  onChange: (item: MilitaryGood) => void;
}) {
  const [word, setWord] = useState("");
  if (!item) return <article><h2>Классификатор ПВН</h2><p>Объект не найден.</p></article>;
  const shown = item.lawPoints.filter((point) => point.description.toLowerCase().includes(word.trim().toLowerCase()));
  return (
    <article>
      <h2>Продукция &gt; Объект № {item.rowNum} &gt; Классификатор ПВН</h2>
      <GoodNav onList={onList} onData={onData} onAnalysis={onAnalysis} />
      <p className="lede">Поиск по классификатору ПВН читает базу. В этом срезе показаны только локальные строки.</p>
      <label className="stack">
        Поиск
        <input value={word} onChange={(event) => setWord(event.target.value)} />
      </label>
      <ul className="plain-list">
        {shown.map((point) => (
          <li key={point.id}>
            <label className="check">
              <input
                type="checkbox"
                checked={point.selected}
                disabled={!editable}
                onChange={(event) => onChange({
                  ...item,
                  lawPoints: item.lawPoints.map((row) => row.id === point.id ? { ...row, selected: event.target.checked } : row),
                })}
              />
              {point.description}
            </label>
          </li>
        ))}
      </ul>
    </article>
  );
}

function GoodAnalysis({
  item,
  editable,
  onList,
  onData,
  onLaw,
  onChange,
}: {
  item: MilitaryGood | undefined;
  editable: boolean;
  onList: () => void;
  onData: () => void;
  onLaw: () => void;
  onChange: (item: MilitaryGood) => void;
}) {
  if (!item) return <article><h2>Анализ</h2><p>Объект не найден.</p></article>;
  const current = item;
  function addDoc() {
    const rowNum = current.civilDocs.reduce((max, doc) => Math.max(max, doc.rowNum), 0) + 1;
    const doc: CivilDoc = { id: Date.now(), rowNum, caption: "", regNum: "", regDate: "" };
    onChange({ ...current, civilDocs: [...current.civilDocs, doc] });
  }
  return (
    <article>
      <h2>Продукция &gt; Объект № {item.rowNum} &gt; Анализ принадлежности к продукции граждаского назначения</h2>
      <GoodNav onList={onList} onData={onData} onLaw={onLaw} />
      <h3>Документ, подтверждающий общепромышленное применение</h3>
      {editable && <button type="button" onClick={addDoc}>Добавить</button>}
      {item.civilDocs.map((doc) => (
        <div key={doc.id} className="note">
          <Field label="Наименование или краткое содержание" value={doc.caption} disabled={!editable} onChange={(caption) => onChange({ ...item, civilDocs: item.civilDocs.map((row) => row.id === doc.id ? { ...row, caption } : row) })} />
          <Field label="Номер" value={doc.regNum} disabled={!editable} onChange={(regNum) => onChange({ ...item, civilDocs: item.civilDocs.map((row) => row.id === doc.id ? { ...row, regNum } : row) })} />
          <Field label="Дата" value={doc.regDate} type="date" disabled={!editable} onChange={(regDate) => onChange({ ...item, civilDocs: item.civilDocs.map((row) => row.id === doc.id ? { ...row, regDate } : row) })} />
          {editable && <button type="button" onClick={() => onChange({ ...item, civilDocs: item.civilDocs.filter((row) => row.id !== doc.id) })}>Удалить</button>}
        </div>
      ))}
      <label className="stack">
        Выводы по результатам анализа
        <textarea value={item.summary} disabled={!editable} onChange={(event) => onChange({ ...item, summary: event.target.value })} />
      </label>
    </article>
  );
}

function DecisionForm({
  dossier,
  editable,
  onEdit,
}: {
  dossier: MilitaryDossier;
  editable: boolean;
  onEdit: (patch: Partial<MilitaryDossier>) => void;
}) {
  return (
    <article>
      <h2>РЕШЕНИЕ ПО АНАЛИЗУ</h2>
      <label className="stack">
        Выводы
        <textarea value={dossier.summary} disabled={!editable} onChange={(event) => onEdit({ summary: event.target.value })} />
      </label>
      <label className="stack">
        Пояснения эксперта
        <textarea value={dossier.comment} disabled={!editable} onChange={(event) => onEdit({ comment: event.target.value })} />
      </label>
    </article>
  );
}

function DocForm({
  dossier,
  editable,
  onEdit,
}: {
  dossier: MilitaryDossier;
  editable: boolean;
  onEdit: (patch: Partial<MilitaryDossier>) => void;
}) {
  function update(doc: MilitaryDocument) {
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
            documents: [...dossier.documents, { id: Date.now(), rowNum: dossier.documents.length + 1, docType: "", caption: "", author: "", used: true }],
          })}
        >
          Добавить
        </button>
      )}
      {dossier.documents.map((doc) => (
        <div key={doc.id} className="note">
          <Field label="Вид документа" value={doc.docType} disabled={!editable} onChange={(docType) => update({ ...doc, docType })} />
          <Field label="Наименование, рег. №" value={doc.caption} disabled={!editable} onChange={(caption) => update({ ...doc, caption })} />
          <Field label="Организации, создавшие и утвердившие документ" value={doc.author} disabled={!editable} onChange={(author) => update({ ...doc, author })} />
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
  notes: MilitaryDossier["requests"];
  editable: boolean;
  onChange: (notes: MilitaryDossier["requests"]) => void;
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function Field({
  label,
  value,
  disabled,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="stack">
      {label}
      <input type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
