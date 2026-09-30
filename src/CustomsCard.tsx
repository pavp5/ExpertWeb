import { useMemo, useState } from "react";
import type { Work } from "./domain.ts";
import { formatDateTime } from "./plan.ts";
import {
  buildCustomsTree,
  Content,
  SUPPLY_TYPES,
  URGENCY,
  type CheckIssue,
  type CustomsDossier,
  type CustomsDocument,
  type CustomsGood,
  type CustomsMember,
} from "./customs.ts";

interface CustomsCardProps {
  work: Work;
  dossier: CustomsDossier;
  onChange: (next: CustomsDossier) => void;
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

export function CustomsCard({
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
}: CustomsCardProps) {
  const editable = work.condition === "work";
  const projectVisible = work.condition !== "new";
  const tree = useMemo(() => buildCustomsTree(dossier), [dossier]);
  const [mode, setMode] = useState<MainMode>("section");
  const [contentId, setContentId] = useState<number>(Content.Content);
  const [objectId, setObjectId] = useState(0);
  const [treeOpen, setTreeOpen] = useState(true);
  const [query, setQuery] = useState("");
  const [showIssues, setShowIssues] = useState(false);
  const [confirmReload, setConfirmReload] = useState(false);

  function edit(patch: Partial<CustomsDossier>) {
    if (!editable) return;
    const editsProject = Object.hasOwn(patch, "project1") || Object.hasOwn(patch, "comments");
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
              <p>
                <button type="button" onClick={() => openNode(Content.ExtraDoc, 0)}>Перечень представленных документов</button>
              </p>
              <ContentPreview dossier={dossier} query={query} />
            </article>
          )}
          {mode === "section" && contentId === Content.Plane && (
            <PlaneForm work={work} dossier={dossier} editable={editable} onEdit={edit} />
          )}
          {mode === "section" && (contentId === Content.ContractData || contentId === Content.ContractRisk) && (
            <ContractForm dossier={dossier} editable={editable} onEdit={edit} />
          )}
          {mode === "section" && (contentId === Content.SupplyData || contentId === Content.SupplyRisk) && (
            <SupplyForm dossier={dossier} editable={editable} onEdit={edit} />
          )}
          {mode === "section" && isMemberList(contentId) && (
            <MemberList title={listTitle(contentId)} members={membersFor(dossier, contentId)} onOpen={(id) => openNode(dataContent(contentId), id)} />
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
          {mode === "section" && (contentId === Content.GoodData || contentId === Content.GoodLaw) && (
            <GoodForm
              good={dossier.goods.find((item) => item.id === objectId)}
              editable={editable}
              showLaw={contentId === Content.GoodLaw}
              onLaw={() => setContentId(Content.GoodLaw)}
              onData={() => setContentId(Content.GoodData)}
              onChange={(good) => edit({ goods: dossier.goods.map((item) => item.id === good.id ? good : item) })}
            />
          )}
          {mode === "section" && contentId === Content.Summary && (
            <SummaryForm dossier={dossier} editable={editable} onEdit={edit} />
          )}
          {mode === "section" && contentId === Content.ExtraDoc && (
            <DocForm dossier={dossier} editable={editable} onEdit={edit} />
          )}
          {mode === "project" && (
            <ProjectForm dossier={dossier} editable={editable} onEdit={edit} />
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
  node: ReturnType<typeof buildCustomsTree>[number];
  nodes: ReturnType<typeof buildCustomsTree>;
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

function ContentPreview({ dossier, query }: { dossier: CustomsDossier; query: string }) {
  const supply = SUPPLY_TYPES.find((item) => item.id === dossier.supplyTypeId)?.label ?? "";
  const blocks = [
    `Сделка: ${dossier.contractName} ${dossier.contractNum}. ${dossier.contractDescription}`,
    `Операция: ${dossier.invoiceCaption}. ${supply}. ${dossier.countryName}. ${dossier.supplyDescription}`,
    ...dossier.goods.map((good) => `Объект ${good.rowNum}: ${good.nameCon}, ТН ВЭД ${good.tnved}. ${good.description}`),
    `Разделы: ${dossier.sections.map((section) => `${section.pos} ${section.description}`).join("; ")}`,
    `Выводы: ${dossier.summaryText}`,
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
  dossier: CustomsDossier;
  editable: boolean;
  onEdit: (patch: Partial<CustomsDossier>) => void;
}) {
  return (
    <article>
      <h2>План работы</h2>
      <dl className="facts">
        <Fact label="Вид работы" value="ЗиО" />
        <Fact label="Срок исполнения" value={formatDateTime(work.expertTerm)} />
        <Fact label="Общая трудоемкость (мин.)" value={work.totalWork == null ? "" : String(work.totalWork)} />
      </dl>
      <div className="facts">
        <Field label="Количество материальных объектов исследования" value={String(dossier.matCount)} disabled={!editable} onChange={(value) => onEdit({ matCount: Number(value) || 0 })} />
        <Field label="Количество информационных объектов исследования" value={String(dossier.infCount)} disabled={!editable} onChange={(value) => onEdit({ infCount: Number(value) || 0 })} />
        <Field label="Количество товаров по спецификации" value={String(work.goodCount)} disabled />
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

function ContractForm({ dossier, editable, onEdit }: { dossier: CustomsDossier; editable: boolean; onEdit: (patch: Partial<CustomsDossier>) => void }) {
  return (
    <article>
      <h2>Внешнеэкономическая сделка &gt; Регистрационные данные</h2>
      <label className="check">
        <input type="checkbox" checked={dossier.isNotContract} disabled={!editable} onChange={(event) => onEdit({ isNotContract: event.target.checked })} />
        БЕЗ ДОГОВОРА
      </label>
      <Field label="Наименование документа" value={dossier.contractName} disabled={!editable} onChange={(contractName) => onEdit({ contractName })} />
      <Field label="Номер документа" value={dossier.contractNum} disabled={!editable} onChange={(contractNum) => onEdit({ contractNum })} />
      <Field label="Дата документа" value={dossier.contractDate} type="date" disabled={!editable} onChange={(contractDate) => onEdit({ contractDate })} />
      <Field label="Срок действия" value={dossier.contractTerm} type="date" disabled={!editable || dossier.isNotContractTerm} onChange={(contractTerm) => onEdit({ contractTerm })} />
      <label className="check">
        <input type="checkbox" checked={dossier.isNotContractTerm} disabled={!editable} onChange={(event) => onEdit({ isNotContractTerm: event.target.checked })} />
        Сделка без срока действия (до исполнения обязательств)
      </label>
      <label className="stack">
        Предмет сделки
        <textarea value={dossier.contractDescription} disabled={!editable} onChange={(event) => onEdit({ contractDescription: event.target.value })} />
      </label>
      <label className="check">
        <input type="checkbox" checked={dossier.isNotContractRisk} disabled={!editable} onChange={(event) => onEdit({ isNotContractRisk: event.target.checked })} />
        Риски по сделке отсутствуют
      </label>
    </article>
  );
}

function SupplyForm({ dossier, editable, onEdit }: { dossier: CustomsDossier; editable: boolean; onEdit: (patch: Partial<CustomsDossier>) => void }) {
  return (
    <article>
      <h2>Внешнеэкономическая операция &gt; Регистрационные данные</h2>
      <label className="stack">
        Характер внешнеэкономической операции
        <select value={dossier.supplyTypeId ?? ""} disabled={!editable} onChange={(event) => onEdit({ supplyTypeId: event.target.value ? Number(event.target.value) : null })}>
          <option value="">—</option>
          {SUPPLY_TYPES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
      <Field label="Документ - основание операции" value={dossier.invoiceCaption} disabled={!editable} onChange={(invoiceCaption) => onEdit({ invoiceCaption })} />
      <Field label="Страна назначения (отправления)" value={dossier.countryName} disabled={!editable} onChange={(countryName) => onEdit({ countryName })} />
      <label className="stack">
        Описание предмета операции
        <textarea value={dossier.supplyDescription} disabled={!editable} onChange={(event) => onEdit({ supplyDescription: event.target.value })} />
      </label>
      <Field label="Условие поставки" value={dossier.incoterms} disabled={!editable} onChange={(incoterms) => onEdit({ incoterms })} />
      <Field label="Место доставки" value={dossier.incotermsPlace} disabled={!editable} onChange={(incotermsPlace) => onEdit({ incotermsPlace })} />
      <label className="check">
        <input type="checkbox" checked={dossier.isNotSupplyRisk} disabled={!editable} onChange={(event) => onEdit({ isNotSupplyRisk: event.target.checked })} />
        Риски по операции отсутствуют
      </label>
    </article>
  );
}

function MemberList({ title, members, onOpen }: { title: string; members: CustomsMember[]; onOpen: (id: number) => void }) {
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
  member: CustomsMember | undefined;
  editable: boolean;
  foreign: boolean;
  onChange: (member: CustomsMember) => void;
}) {
  if (!member) return <article><h2>Регистрационные данные</h2><p>Участник не найден.</p></article>;
  const patch = (part: Partial<CustomsMember>) => onChange({ ...member, ...part });
  return (
    <article>
      <h2>Регистрационные данные</h2>
      <Field label="Полное наименование" value={member.nameLong} disabled={!editable} onChange={(nameLong) => patch({ nameLong })} />
      <Field label="Краткое наименование" value={member.nameShort} disabled={!editable} onChange={(nameShort) => patch({ nameShort })} />
      {!foreign && <Field label="ИНН" value={member.inn} disabled={!editable} onChange={(inn) => patch({ inn })} />}
      <Field label="Юридический адрес" value={member.addressLegalFull} disabled={!editable} onChange={(addressLegalFull) => patch({ addressLegalFull })} />
      <Field label="Страна юридического адреса" value={member.addressLegalCountry} disabled={!editable} onChange={(addressLegalCountry) => patch({ addressLegalCountry })} />
      <Field label="Город юридического адреса" value={member.addressLegalTown} disabled={!editable} onChange={(addressLegalTown) => patch({ addressLegalTown })} />
    </article>
  );
}

function GoodForm({
  good,
  editable,
  showLaw,
  onLaw,
  onData,
  onChange,
}: {
  good: CustomsGood | undefined;
  editable: boolean;
  showLaw: boolean;
  onLaw: () => void;
  onData: () => void;
  onChange: (good: CustomsGood) => void;
}) {
  if (!good) return <article><h2>Регистрационные данные</h2><p>Объект не найден.</p></article>;
  const patch = (part: Partial<CustomsGood>) => onChange({ ...good, ...part });
  return (
    <article>
      <h2>Продукция &gt; Объект № {good.rowNum}</h2>
      <div className="row-actions">
        <button type="button" aria-pressed={!showLaw} onClick={onData}>РЕГИСТРАЦИОННЫЕ ДАННЫЕ</button>
        <button type="button" aria-pressed={showLaw} onClick={onLaw}>ЕДИНЫЙ ПЕРЕЧЕНЬ</button>
      </div>
      {!showLaw && (
        <>
          <Field label="Коммерческое наименование" value={good.nameCon} disabled={!editable} onChange={(nameCon) => patch({ nameCon })} />
          <Field label="Обозначение" value={good.nameDec} disabled={!editable || good.isNotDec} onChange={(nameDec) => patch({ nameDec })} />
          <label className="check">
            <input type="checkbox" checked={good.isNotDec} disabled={!editable} onChange={(event) => patch({ isNotDec: event.target.checked })} />
            Обозначение отсутствует
          </label>
          <Field label="Вид объекта" value={good.typeName} disabled={!editable} onChange={(typeName) => patch({ typeName })} />
          <Field label="Код ТН ВЭД" value={good.tnved} disabled={!editable} onChange={(tnved) => patch({ tnved })} />
          <Field label="Номер CAS" value={good.cas} disabled={!editable} onChange={(cas) => patch({ cas })} />
          <Field label="Обоснование кода ТН ВЭД" value={good.tnvedComment} disabled={!editable} onChange={(tnvedComment) => patch({ tnvedComment })} />
          <Field label="Область применения" value={good.area} disabled={!editable} onChange={(area) => patch({ area })} />
          <Field label="Назначение" value={good.used} disabled={!editable} onChange={(used) => patch({ used })} />
          <label className="stack">
            Техническое описание
            <textarea value={good.description} disabled={!editable} onChange={(event) => patch({ description: event.target.value })} />
          </label>
        </>
      )}
      {showLaw && (
        <Field label="Дата исследования по Единому перечню" value={good.studyDate} type="date" disabled={!editable} onChange={(studyDate) => patch({ studyDate })} />
      )}
    </article>
  );
}

function SummaryForm({ dossier, editable, onEdit }: { dossier: CustomsDossier; editable: boolean; onEdit: (patch: Partial<CustomsDossier>) => void }) {
  return (
    <article>
      <h2>РЕШЕНИЕ ПО АНАЛИЗУ</h2>
      <h3>Разделы Единого перечня, в отношении которых проводилась идентификационная экспертиза</h3>
      {dossier.sections.length === 0 && <p>Разделы не выбраны.</p>}
      <ul className="plain-list">
        {dossier.sections.map((section) => (
          <li key={section.id}>
            {section.pos}. {section.description}
            {editable && (
              <button type="button" onClick={() => onEdit({ sections: dossier.sections.filter((item) => item.id !== section.id) })}>
                Убрать из выборки
              </button>
            )}
          </li>
        ))}
      </ul>
      <label className="stack">
        Выводы
        <textarea value={dossier.summaryText} disabled={!editable} onChange={(event) => onEdit({ summaryText: event.target.value })} />
      </label>
    </article>
  );
}

function DocForm({ dossier, editable, onEdit }: { dossier: CustomsDossier; editable: boolean; onEdit: (patch: Partial<CustomsDossier>) => void }) {
  function update(doc: CustomsDocument) {
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

function ProjectForm({ dossier, editable, onEdit }: { dossier: CustomsDossier; editable: boolean; onEdit: (patch: Partial<CustomsDossier>) => void }) {
  const comments = dossier.comments;
  return (
    <article>
      <h2>Проект #1</h2>
      <p className="lede">Текст проекта заключения. Редактор RTF из ProjectChildControl в этом срезе не переносится.</p>
      <textarea value={dossier.project1} disabled={!editable} onChange={(event) => onEdit({ project1: event.target.value, projectsStale: false })} />
      <h3>Пояснения эксперта к пунктам документа</h3>
      {(["p2", "p3", "p4", "p5", "p6"] as const).map((key) => (
        <Field
          key={key}
          label={key.toUpperCase().replace("P", "П.")}
          value={comments[key]}
          disabled={!editable}
          onChange={(value) => onEdit({ comments: { ...comments, [key]: value }, projectsStale: false })}
        />
      ))}
    </article>
  );
}

function RequestList({
  notes,
  editable,
  onChange,
}: {
  notes: CustomsDossier["requests"];
  editable: boolean;
  onChange: (notes: CustomsDossier["requests"]) => void;
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

function membersFor(dossier: CustomsDossier, contentId: number): CustomsMember[] {
  if (contentId === Content.ContractRusList) return dossier.members.filter((item) => item.conRusNum > 0);
  if (contentId === Content.ContractNusList) return dossier.members.filter((item) => item.conNusNum > 0);
  if (contentId === Content.SupplyRusList) return dossier.members.filter((item) => item.supRusNum > 0);
  if (contentId === Content.SupplyNusList) return dossier.members.filter((item) => item.supNusNum > 0);
  return dossier.members.filter((item) => item.supEndNum > 0);
}
