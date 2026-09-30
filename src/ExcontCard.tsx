import { useMemo, useState } from "react";
import type { Work } from "./domain.ts";
import { formatDateTime } from "./plan.ts";
import {
  buildContentTree,
  checkExcont,
  Content,
  projectCount,
  projectSlots,
  SUMMARY_OPTIONS,
  SUPPLY_TYPES,
  WORK_KINDS,
  type CheckIssue,
  type ExcontDossier,
  type ExcontGood,
  type ExcontMember,
} from "./excont.ts";

interface ExcontCardProps {
  work: Work;
  dossier: ExcontDossier;
  onChange: (next: ExcontDossier) => void;
  onSave: () => void;
  onReload: () => void;
  onSend: () => void;
  onClose: () => void;
  onSign: () => void;
  issues: CheckIssue[];
  onCheck: () => void;
  notice: string | null;
}

type MainMode = "section" | "project1" | "project2" | "request" | "internal";

export function ExcontCard({
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
}: ExcontCardProps) {
  const editable = work.condition === "work";
  const projectsEnabled = work.condition !== "new";
  const tree = useMemo(() => buildContentTree(dossier), [dossier]);
  const [mode, setMode] = useState<MainMode>("section");
  const [contentId, setContentId] = useState<number>(Content.Content);
  const [objectId, setObjectId] = useState(0);
  const [treeOpen, setTreeOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [showIssues, setShowIssues] = useState(false);

  function edit(patch: Partial<ExcontDossier>) {
    if (!editable) return;
    const editsProject = Object.hasOwn(patch, "project1") || Object.hasOwn(patch, "project2");
    const hasProject = dossier.project1.trim() !== "" || dossier.project2.trim() !== "";
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

  function openIssue(issue: CheckIssue) {
    openNode(issue.contentId, issue.objectId);
    setShowIssues(true);
  }

  const roots = tree.filter((node) => node.parentId == null);
  const supplyLabel = SUPPLY_TYPES.find((item) => item.id === dossier.supplyTypeId)?.label ?? "—";
  const summaryLabel = SUMMARY_OPTIONS.find((item) => item.id === dossier.summaryId)?.label ?? "—";

  return (
    <section className="panel excont">
      <div className="toolbar">
        <div className="tool-group">
          <span>Данные</span>
          <div className="row-actions">
            {editable && <button type="button" onClick={onSave}>СОХРАНИТЬ</button>}
            <button type="button" onClick={onReload}>ПЕРЕЧИТАТЬ</button>
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
            <button type="button" disabled={!projectsEnabled} aria-pressed={mode === "project1"} onClick={() => setMode("project1")}>ПРОЕКТ #1</button>
            <button type="button" disabled={!projectsEnabled} aria-pressed={mode === "project2"} onClick={() => setMode("project2")}>ПРОЕКТ #2</button>
            <button type="button" aria-pressed={mode === "request"} onClick={() => setMode("request")}>Запросы</button>
            <button type="button" aria-pressed={mode === "internal"} onClick={() => setMode("internal")}>Вн. документы</button>
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
              <div className="row-actions">
                <label>
                  Поиск
                  <input value={query} onChange={(event) => setQuery(event.target.value)} />
                </label>
              </div>
              <label className="stack">
                Обобщенное наименование объектов экспертизы
                <input
                  value={dossier.description}
                  disabled={!editable}
                  onChange={(event) => edit({ description: event.target.value })}
                />
              </label>
              <ContentPreview dossier={dossier} supplyLabel={supplyLabel} summaryLabel={summaryLabel} query={query} />
            </article>
          )}
          {mode === "section" && contentId === Content.Plane && (
            <article>
              <h2>План работы</h2>
              <dl className="facts">
                <Fact label="Вид" value="ДН" />
                <Fact label="Количество объектов исследования" value={String(work.goodCount)} />
                <Fact label="Общая трудоемкость (мин.)" value={work.totalWork == null ? "" : String(work.totalWork)} />
                <Fact label="Срок исполнения" value={formatDateTime(work.expertTerm)} />
                <Fact label="Состояние" value={work.conditionName} />
              </dl>
            </article>
          )}
          {mode === "section" && (contentId === Content.ContractData || contentId === Content.ContractRisk) && (
            <ContractForm dossier={dossier} editable={editable} onEdit={edit} />
          )}
          {mode === "section" && (contentId === Content.SupplyData || contentId === Content.SupplyRisk) && (
            <SupplyForm dossier={dossier} editable={editable} onEdit={edit} />
          )}
          {mode === "section" && isMemberList(contentId) && (
            <MemberList
              title={listTitle(contentId)}
              members={membersFor(dossier, contentId)}
              onOpen={(id) => openNode(dataContent(contentId), id)}
            />
          )}
          {mode === "section" && isMemberData(contentId) && (
            <MemberForm
              member={dossier.members.find((item) => item.id === objectId)}
              editable={editable}
              foreign={contentId !== Content.ContractRusData && contentId !== Content.SupplyRusData}
              onChange={(member) => edit({ members: dossier.members.map((item) => item.id === member.id ? member : item) })}
            />
          )}
          {mode === "section" && contentId === Content.GoodList && (
            <article>
              <h2>Продукция (объекты экспертизы)</h2>
              {dossier.goods.length === 0 && <p>Объектов экспертизы нет.</p>}
              <ul className="plain-list">
                {dossier.goods.map((good) => (
                  <li key={good.id}>
                    <button type="button" onClick={() => openNode(Content.GoodData, good.id)}>
                      {good.rowNum}. {good.nameCon || "[нет наименования]"}
                    </button>
                  </li>
                ))}
              </ul>
            </article>
          )}
          {mode === "section" && contentId === Content.GoodData && (
            <GoodForm
              good={dossier.goods.find((item) => item.id === objectId)}
              editable={editable}
              onChange={(good) => edit({ goods: dossier.goods.map((item) => item.id === good.id ? good : item) })}
              onList={() => openNode(Content.GoodList, 0)}
            />
          )}
          {mode === "section" && contentId === Content.Summary && (
            <SummaryForm dossier={dossier} editable={editable} onEdit={edit} />
          )}
          {mode === "section" && (contentId === Content.ExtraInfo || contentId === Content.ExtraDoc) && (
            <ExtraForm dossier={dossier} editable={editable} onEdit={edit} />
          )}
          {mode === "project1" && <ProjectForm title="Проект #1" value={dossier.project1} editable={editable} onChange={(project1) => edit({ project1, projectsStale: false })} />}
          {mode === "project2" && <ProjectForm title="Проект #2" value={dossier.project2} editable={editable} onChange={(project2) => edit({ project2, projectsStale: false })} />}
          {mode === "request" && (
            <NoteList
              title="Запросы"
              empty="Запросов нет"
              notes={dossier.requests}
              editable={editable}
              onChange={(requests) => edit({ requests })}
            />
          )}
          {mode === "internal" && (
            <NoteList
              title="Внутренние документы"
              empty="Документов нет"
              notes={dossier.internals}
              editable={editable}
              onChange={(internals) => edit({ internals })}
            />
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
              {issues.map((issue, index) => (
                <li key={`${issue.contentId}-${issue.objectId}-${index}`}>
                  <button type="button" onClick={() => openIssue(issue)}>
                    <small>{issue.place}</small>
                    {issue.description}
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
      <p className="lede slim">
        Проектов: {projectCount(dossier)} из {projectSlots(dossier)}.
        {dossier.projectsStale ? " Данные изменены после создания проектов заключений." : ""}
      </p>
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
  node: ReturnType<typeof buildContentTree>[number];
  nodes: ReturnType<typeof buildContentTree>;
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
            <TreeBranch
              key={`${child.id}-${child.contentId}`}
              node={child}
              nodes={nodes}
              open={open}
              contentId={contentId}
              objectId={objectId}
              onOpen={onOpen}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function ContentPreview({
  dossier,
  supplyLabel,
  summaryLabel,
  query,
}: {
  dossier: ExcontDossier;
  supplyLabel: string;
  summaryLabel: string;
  query: string;
}) {
  const blocks = [
    `Сделка: ${dossier.contractName} ${dossier.contractNum}. ${dossier.contractDescription}`,
    `Операция: ${supplyLabel}. ${dossier.countryName}. ${dossier.supplyDescription}`,
    ...dossier.goods.map((good) => `Объект ${good.rowNum}: ${good.nameCon}, ТН ВЭД ${good.tnved}. ${good.description}`),
    `Выводы: ${summaryLabel}. ${dossier.summaryText}`,
  ].filter((block) => block.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="preview">
      {blocks.map((block) => <p key={block}>{block}</p>)}
      {blocks.length === 0 && <p>В содержании ничего не найдено.</p>}
    </div>
  );
}

function ContractForm({ dossier, editable, onEdit }: { dossier: ExcontDossier; editable: boolean; onEdit: (patch: Partial<ExcontDossier>) => void }) {
  return (
    <article>
      <h2>Внешнеэкономическая сделка &gt; Регистрационные данные</h2>
      <label className="check">
        <input type="checkbox" checked={dossier.isNotContract} disabled={!editable} onChange={(event) => onEdit({ isNotContract: event.target.checked })} />
        БЕЗ ДОГОВОРА
      </label>
      <div className="facts">
        <Field label="Наименование документа" value={dossier.contractName} disabled={!editable} onChange={(contractName) => onEdit({ contractName })} />
        <Field label="Номер документа" value={dossier.contractNum} disabled={!editable} onChange={(contractNum) => onEdit({ contractNum })} />
        <Field label="Дата документа" value={dossier.contractDate} type="date" disabled={!editable} onChange={(contractDate) => onEdit({ contractDate })} />
        <Field label="Срок действия" value={dossier.contractTerm} type="date" disabled={!editable || dossier.isNotContractTerm} onChange={(contractTerm) => onEdit({ contractTerm })} />
      </div>
      <label className="check">
        <input type="checkbox" checked={dossier.isNotContractTerm} disabled={!editable} onChange={(event) => onEdit({ isNotContractTerm: event.target.checked })} />
        Сделка без срока действия (до исполнения обязательств)
      </label>
      <label className="stack">
        Описание предмета сделки
        <textarea value={dossier.contractDescription} disabled={!editable} onChange={(event) => onEdit({ contractDescription: event.target.value })} />
      </label>
      <label className="check">
        <input type="checkbox" checked={dossier.isNotContractRisk} disabled={!editable} onChange={(event) => onEdit({ isNotContractRisk: event.target.checked })} />
        Риски по сделке отсутствуют
      </label>
    </article>
  );
}

function SupplyForm({ dossier, editable, onEdit }: { dossier: ExcontDossier; editable: boolean; onEdit: (patch: Partial<ExcontDossier>) => void }) {
  return (
    <article>
      <h2>Внешнеэкономическая операция &gt; Регистрационные данные</h2>
      <label className="stack">
        Характер внешнеэкономической операции
        <select
          value={dossier.supplyTypeId ?? ""}
          disabled={!editable}
          onChange={(event) => onEdit({ supplyTypeId: event.target.value ? Number(event.target.value) : null })}
        >
          <option value="">—</option>
          {SUPPLY_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <div className="facts">
        <Field label="Страна назначения (отправления)" value={dossier.countryName} disabled={!editable} onChange={(countryName) => onEdit({ countryName })} />
        <Field label="Страна банка" value={dossier.bankCountry} disabled={!editable} onChange={(bankCountry) => onEdit({ bankCountry })} />
        <Field label="Условие поставки по Инкотермс" value={dossier.incoterms} disabled={!editable} onChange={(incoterms) => onEdit({ incoterms })} />
      </div>
      <label className="stack">
        Описание предмета операции
        <textarea value={dossier.supplyDescription} disabled={!editable} onChange={(event) => onEdit({ supplyDescription: event.target.value })} />
      </label>
      <label className="check">
        <input type="checkbox" checked={dossier.isNotSupplyRisk} disabled={!editable} onChange={(event) => onEdit({ isNotSupplyRisk: event.target.checked })} />
        Риски по операции отсутствуют
      </label>
    </article>
  );
}

function MemberList({ title, members, onOpen }: { title: string; members: ExcontMember[]; onOpen: (id: number) => void }) {
  return (
    <article>
      <h2>{title}</h2>
      {members.length === 0 && <p>Участников нет.</p>}
      <ul className="plain-list">
        {members.map((member) => (
          <li key={member.id}>
            <button type="button" onClick={() => onOpen(member.id)}>{member.nameLong || "[нет наименования]"}</button>
          </li>
        ))}
      </ul>
    </article>
  );
}

function MemberForm({
  member,
  editable,
  foreign,
  onChange,
}: {
  member: ExcontMember | undefined;
  editable: boolean;
  foreign: boolean;
  onChange: (member: ExcontMember) => void;
}) {
  if (!member) return <article><h2>Регистрационные данные</h2><p>Участник не найден.</p></article>;
  const patch = (part: Partial<ExcontMember>) => onChange({ ...member, ...part });
  return (
    <article>
      <h2>Регистрационные данные</h2>
      <div className="facts">
        <Field label="Полное наименование" value={member.nameLong} disabled={!editable} onChange={(nameLong) => patch({ nameLong })} />
        <Field label="Краткое наименование" value={member.nameShort} disabled={!editable} onChange={(nameShort) => patch({ nameShort })} />
        {!foreign && <Field label="ИНН" value={member.inn} disabled={!editable} onChange={(inn) => patch({ inn })} />}
        <Field label="Юридический адрес" value={member.addressLegalFull} disabled={!editable} onChange={(addressLegalFull) => patch({ addressLegalFull })} />
        <Field label="Страна юридического адреса" value={member.addressLegalCountry} disabled={!editable} onChange={(addressLegalCountry) => patch({ addressLegalCountry })} />
        <Field label="Город юридического адреса" value={member.addressLegalTown} disabled={!editable} onChange={(addressLegalTown) => patch({ addressLegalTown })} />
      </div>
      {foreign && (
        <>
          <h3>Запреты и ограничения</h3>
          <label className="check">
            <input type="checkbox" checked={member.isNotEmbargo} disabled={!editable} onChange={(event) => patch({ isNotEmbargo: event.target.checked })} />
            Запреты и ограничения отсутствуют
          </label>
          <h3>Профиль</h3>
          <label className="stack">
            Профиль фирмы
            <textarea value={member.proDescription} disabled={!editable} onChange={(event) => patch({ proDescription: event.target.value })} />
          </label>
          <Field label="Источник данных" value={member.proSource} disabled={!editable} onChange={(proSource) => patch({ proSource })} />
        </>
      )}
      <h3>Риски</h3>
      <label className="check">
        <input type="checkbox" checked={member.isNotRisk} disabled={!editable} onChange={(event) => patch({ isNotRisk: event.target.checked })} />
        Риски отсутствуют
      </label>
    </article>
  );
}

function GoodForm({
  good,
  editable,
  onChange,
  onList,
}: {
  good: ExcontGood | undefined;
  editable: boolean;
  onChange: (good: ExcontGood) => void;
  onList: () => void;
}) {
  if (!good) return <article><h2>Регистрационные данные</h2><p>Объект не найден.</p></article>;
  const patch = (part: Partial<ExcontGood>) => onChange({ ...good, ...part });
  return (
    <article>
      <h2>Продукция &gt; Объект № {good.rowNum}</h2>
      <button type="button" onClick={onList}>Список</button>
      <h3>Регистрационные данные</h3>
      <div className="facts">
        <Field label="Коммерческое наименование" value={good.nameCon} disabled={!editable} onChange={(nameCon) => patch({ nameCon })} />
        <Field label="Обозначение" value={good.nameDec} disabled={!editable || good.isNotDec} onChange={(nameDec) => patch({ nameDec })} />
        <Field label="Код ТН ВЭД" value={good.tnved} disabled={!editable} onChange={(tnved) => patch({ tnved })} />
        <Field label="Вид объекта" value={good.typeName} disabled={!editable} onChange={(typeName) => patch({ typeName })} />
        <Field label="Область применения" value={good.area} disabled={!editable} onChange={(area) => patch({ area })} />
        <Field label="Назначение" value={good.used} disabled={!editable} onChange={(used) => patch({ used })} />
      </div>
      <label className="check">
        <input type="checkbox" checked={good.isNotDec} disabled={!editable} onChange={(event) => patch({ isNotDec: event.target.checked })} />
        Обозначение отсутствует
      </label>
      <label className="stack">
        Техническое описание
        <textarea value={good.description} disabled={!editable} onChange={(event) => patch({ description: event.target.value })} />
      </label>
      <h3>Запреты и ограничения</h3>
      <label className="check">
        <input type="checkbox" checked={good.isNotEmbargo} disabled={!editable} onChange={(event) => patch({ isNotEmbargo: event.target.checked })} />
        Запреты и ограничения отсутствуют
      </label>
      <h3>Контрольные списки</h3>
      <div className="facts">
        <Field label="Дата исследования" value={good.studyDate} type="date" disabled={!editable} onChange={(studyDate) => patch({ studyDate })} />
        <label className="stack">
          Результат исследования
          <select
            value={good.studySummaryId}
            disabled={!editable}
            onChange={(event) => patch({ studySummaryId: Number(event.target.value) })}
          >
            <option value={0}>Отсутствует в нормативных документах</option>
            <option value={1}>Не соответствует</option>
            <option value={2}>Соответствует</option>
          </select>
        </label>
      </div>
      <h3>Риски</h3>
      <label className="check">
        <input type="checkbox" checked={good.isNotRisk} disabled={!editable} onChange={(event) => patch({ isNotRisk: event.target.checked })} />
        Риски отсутствуют
      </label>
    </article>
  );
}

function SummaryForm({ dossier, editable, onEdit }: { dossier: ExcontDossier; editable: boolean; onEdit: (patch: Partial<ExcontDossier>) => void }) {
  return (
    <article>
      <h2>Решение по анализу</h2>
      <label className="stack">
        Выводы идентификационной экспертизы
        <select value={dossier.summaryId ?? ""} disabled={!editable} onChange={(event) => onEdit({ summaryId: event.target.value ? Number(event.target.value) : null })}>
          <option value="">—</option>
          {SUMMARY_OPTIONS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label className="stack">
        Выводы
        <textarea value={dossier.summaryText} disabled={!editable} onChange={(event) => onEdit({ summaryText: event.target.value })} />
      </label>
      <label className="stack">
        Анализ выявленных рисков
        <textarea value={dossier.summaryRisk} disabled={!editable} onChange={(event) => onEdit({ summaryRisk: event.target.value })} />
      </label>
    </article>
  );
}

function ExtraForm({ dossier, editable, onEdit }: { dossier: ExcontDossier; editable: boolean; onEdit: (patch: Partial<ExcontDossier>) => void }) {
  return (
    <article>
      <h2>Дополнительная информация</h2>
      <label className="stack">
        Характеристика экспертизы
        <select value={dossier.kindId} disabled={!editable} onChange={(event) => onEdit({ kindId: Number(event.target.value) })}>
          {WORK_KINDS.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <label className="stack">
        Комментарий к характеристике экспертизы
        <textarea value={dossier.kindComment} disabled={!editable} onChange={(event) => onEdit({ kindComment: event.target.value })} />
      </label>
      <Field label="Срок действия заключения" value={dossier.docTerm} type="date" disabled={!editable} onChange={(docTerm) => onEdit({ docTerm })} />
      <label className="stack">
        Дополнительная информация, имеющая значение для целей экспортного контроля
        <textarea value={dossier.extraComment} disabled={!editable} onChange={(event) => onEdit({ extraComment: event.target.value })} />
      </label>
      <h3>Перечень документов</h3>
      <label className="check">
        <input type="checkbox" checked={dossier.isDocRule} disabled={!editable} onChange={(event) => onEdit({ isDocRule: event.target.checked })} />
        Провоспособность удостоверяю
      </label>
      {dossier.documents.length === 0 && <p>Документов нет.</p>}
      <ul className="plain-list">
        {dossier.documents.map((doc) => (
          <li key={doc.id}>
            <label className="check">
              <input
                type="checkbox"
                checked={doc.used}
                disabled={!editable}
                onChange={(event) => onEdit({
                  documents: dossier.documents.map((item) => item.id === doc.id ? { ...item, used: event.target.checked } : item),
                })}
              />
              {doc.caption}
            </label>
          </li>
        ))}
      </ul>
    </article>
  );
}

function ProjectForm({ title, value, editable, onChange }: { title: string; value: string; editable: boolean; onChange: (value: string) => void }) {
  return (
    <article>
      <h2>{title}</h2>
      <p className="lede">Текст проекта заключения. Редактор RTF из ProjectChildControl в этом срезе не переносится.</p>
      <textarea value={value} disabled={!editable} onChange={(event) => onChange(event.target.value)} />
    </article>
  );
}

function NoteList({
  title,
  empty,
  notes,
  editable,
  onChange,
}: {
  title: string;
  empty: string;
  notes: { id: number; caption: string; text: string }[];
  editable: boolean;
  onChange: (notes: { id: number; caption: string; text: string }[]) => void;
}) {
  return (
    <article>
      <h2>{title}</h2>
      {editable && (
        <button
          type="button"
          onClick={() => onChange([...notes, { id: Date.now(), caption: `${title} ${notes.length + 1}`, text: "" }])}
        >
          Создать
        </button>
      )}
      {notes.length === 0 && <p>{empty}</p>}
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
  onChange: (value: string) => void;
  disabled: boolean;
  type?: string;
}) {
  return (
    <label className="stack">
      {label}
      <input type={type} value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
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

function isMemberList(contentId: number): boolean {
  return [Content.ContractRusList, Content.ContractNusList, Content.SupplyRusList, Content.SupplyNusList, Content.SupplyEndList].includes(contentId as 40);
}

function isMemberData(contentId: number): boolean {
  return [Content.ContractRusData, Content.ContractNusData, Content.SupplyRusData, Content.SupplyNusData, Content.SupplyEndData].includes(contentId as 41);
}

function dataContent(listId: number): number {
  if (listId === Content.ContractRusList) return Content.ContractRusData;
  if (listId === Content.ContractNusList) return Content.ContractNusData;
  if (listId === Content.SupplyRusList) return Content.SupplyRusData;
  if (listId === Content.SupplyNusList) return Content.SupplyNusData;
  return Content.SupplyEndData;
}

function listTitle(contentId: number): string {
  if (contentId === Content.ContractRusList) return "Российские участники сделки";
  if (contentId === Content.ContractNusList) return "Иностранные участники сделки";
  if (contentId === Content.SupplyRusList) return "Российские участники операции";
  if (contentId === Content.SupplyNusList) return "Иностранные покупатели (продавцы)";
  return "Потребители (конечные пользователи)";
}

function membersFor(dossier: ExcontDossier, contentId: number): ExcontMember[] {
  if (contentId === Content.ContractRusList) return dossier.members.filter((item) => item.conRusNum > 0);
  if (contentId === Content.ContractNusList) return dossier.members.filter((item) => item.conNusNum > 0);
  if (contentId === Content.SupplyRusList) return dossier.members.filter((item) => item.supRusNum > 0);
  if (contentId === Content.SupplyNusList) return dossier.members.filter((item) => item.supNusNum > 0);
  return dossier.members.filter((item) => item.supEndNum > 0);
}

export function sendBlockers(dossier: ExcontDossier, work: Work, today = new Date()): string[] {
  const blockers: string[] = [];
  if (work.isAskSend) blockers.push("Работы в состоянии \"Запрос\" на утверждение не отправляются.");
  if (work.isStop) blockers.push("Приостановленные работы на утверждение не отправляются.");
  if (checkExcont(dossier, today).length > 0) blockers.push("В работе обнаружены ошибки.");
  if (projectCount(dossier) !== projectSlots(dossier)) {
    blockers.push("В работе отсутствует необходимое количество проектов заключений. Создайте проекты заключений.");
  }
  if (dossier.projectsStale) {
    blockers.push("Данные работы были изменены после создания проектов заключений.\nСоздайте новые проекты заключений.");
  }
  return blockers;
}
