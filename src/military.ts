/** Карточка гражданской продукции: Cprp.DxData.Work.Military. */

import type { Work } from "./domain.ts";

export const Content = {
  Content: 10,
  Plane: 20,
  SupplyRusData: 41,
  GoodList: 100,
  GoodData: 101,
  GoodLaw: 104,
  GoodSummary: 105,
  Summary: 110,
  ExtraDoc: 130,
  Project: 140,
  Request: 150,
} as const;

export const URGENCY: { id: number; label: string }[] = [
  { id: 1, label: "Без срочности (16 рабочих часов)" },
  { id: 2, label: "Повышенная (8 рабочих часов)" },
  { id: 3, label: "Срочная (4 рабочих часа)" },
];

/** Локальная строка GoodTypeHandbookTable: id и codeName. Каталог SQL не подключён. */
export const GOOD_TYPES: { id: number; codeName: string }[] = [
  { id: 1, codeName: "Готовое изделие" },
];

/** PlaneChildControl: флажок «Без оплаты» пишет changeSourceId = 4. */
export const FREE_WORK_SOURCE = 4;

export interface MilitaryMember {
  id: number;
  nameLong: string;
  nameShort: string;
  kind: string;
  inn: string;
  kpp: string;
  addressLegalFull: string;
  addressLegalCountry: string;
  addressLegalTown: string;
}

export interface CivilDoc {
  id: number;
  rowNum: number;
  caption: string;
  regNum: string;
  regDate: string;
}

export interface LawPoint {
  id: number;
  description: string;
  selected: boolean;
}

export interface MilitaryGood {
  id: number;
  rowNum: number;
  nameCon: string;
  nameDec: string;
  isNotDec: boolean;
  typeId: number | null;
  tnved: string;
  cas: string;
  area: string;
  used: string;
  description: string;
  summary: string;
  civilDocs: CivilDoc[];
  lawPoints: LawPoint[];
}

export interface MilitaryDocument {
  id: number;
  rowNum: number;
  docType: string;
  caption: string;
  author: string;
  used: boolean;
}

export interface MilitaryNote {
  id: number;
  caption: string;
  text: string;
}

export interface MilitaryDossier {
  workId: number;
  description: string;
  matCount: number;
  infCount: number;
  addWorkCount: number;
  langCount: number;
  urgencyId: number;
  complexity: string;
  changeSourceId: number;
  isSendQuery: boolean;
  isMakeProfile: boolean;
  planeComment: string;
  goodArea: string;
  goodUsed: string;
  member: MilitaryMember | null;
  contractCaption: string;
  goods: MilitaryGood[];
  summary: string;
  comment: string;
  isDocRule: boolean;
  documents: MilitaryDocument[];
  project1: string;
  projectsStale: boolean;
  requests: MilitaryNote[];
}

export interface ContentNode {
  id: number;
  parentId: number | null;
  contentId: number;
  objectId: number;
  caption: string;
}

export interface CheckIssue {
  place: string;
  description: string;
  contentId: number;
  objectId: number;
}

function text(value: string | null | undefined): boolean {
  return Boolean(value && value.trim());
}

/** ContentDataTable.DataReload: план, российский участник, продукция, решение. */
export function buildMilitaryTree(dossier: MilitaryDossier): ContentNode[] {
  const nodes: ContentNode[] = [
    { id: Content.Plane, parentId: null, contentId: Content.Plane, objectId: 0, caption: "ПЛАН РАБОТЫ" },
    { id: Content.SupplyRusData, parentId: null, contentId: Content.SupplyRusData, objectId: 0, caption: "РОССИЙСКИЙ УЧАСТНИК" },
    { id: Content.GoodList, parentId: null, contentId: Content.GoodList, objectId: 0, caption: "ПРОДУКЦИЯ (ОБЪЕКТЫ ЭКСПЕРТИЗЫ)" },
  ];
  for (const good of [...dossier.goods].sort((a, b) => a.rowNum - b.rowNum)) {
    const name = good.nameCon.trim() || "[нет наименования]";
    nodes.push({
      id: 1000 + nodes.length,
      parentId: Content.GoodList,
      contentId: Content.GoodData,
      objectId: good.id,
      caption: `${good.rowNum}. ${name}`,
    });
  }
  nodes.push({ id: Content.Summary, parentId: null, contentId: Content.Summary, objectId: 0, caption: "РЕШЕНИЕ ПО АНАЛИЗУ" });
  return nodes;
}

function issue(issues: CheckIssue[], place: string, description: string, contentId: number, objectId = 0) {
  issues.push({ place, description, contentId, objectId });
}

/** CheckWork для обычной работы. CheckPlane вызывается только для состояний плана. */
export function checkMilitary(dossier: MilitaryDossier): CheckIssue[] {
  const issues: CheckIssue[] = [];
  if (!text(dossier.description)) {
    issue(issues, "Сведения о работе > Продукция", "Не указано обобщенное наименование объектов экспертизы", Content.Content);
  }
  checkMember(issues, dossier);
  checkDocs(issues, dossier);
  checkGoods(issues, dossier);
  checkDecision(issues, dossier);
  return issues;
}

function checkMember(issues: CheckIssue[], dossier: MilitaryDossier) {
  if (!dossier.member) {
    issue(issues, "Российский участник внешнеэкономической операции", "Отсутствует российский участник внешнеэкономической операции", Content.SupplyRusData);
    return;
  }
  const member = dossier.member;
  const place = "Российский участник внешнеэкономической операции";
  if (!text(member.nameLong)) issue(issues, place, "Не указано полное наименование", Content.SupplyRusData, member.id);
  if (!text(member.nameShort)) issue(issues, place, "Не указано краткое наименование", Content.SupplyRusData, member.id);
  const inn = member.inn.trim();
  if (!text(inn)) {
    issue(issues, place, "Не указан ИНН", Content.SupplyRusData, member.id);
  } else if (!/^\d+$/.test(inn) || (inn.length !== 10 && inn.length !== 12)) {
    issue(issues, place, "Указан неверный ИНН", Content.SupplyRusData, member.id);
  }
  if (!text(member.addressLegalFull)) issue(issues, place, "Не указан юридический адрес", Content.SupplyRusData, member.id);
  if (!text(member.addressLegalCountry)) issue(issues, place, "Не указана страна юридического адреса", Content.SupplyRusData, member.id);
  if (!text(member.addressLegalTown)) issue(issues, place, "Не указан город юридического адреса", Content.SupplyRusData, member.id);
  if (!text(dossier.contractCaption)) {
    issue(issues, place, "Не указан документ-основание внешнеэкономической операции", Content.SupplyRusData, member.id);
  }
}

function checkDocs(issues: CheckIssue[], dossier: MilitaryDossier) {
  const used = dossier.documents.filter((doc) => doc.used);
  if (used.length === 0) {
    issue(issues, "Сведения о работе > Перечень документов", "Отсутствуют документы, использованные при проведении экспертизы", Content.ExtraDoc);
    return;
  }
  for (const doc of [...used].sort((a, b) => a.rowNum - b.rowNum)) {
    const place = `Сведения о работе > Перечень документов > Объект № ${doc.rowNum}`;
    if (!text(doc.docType)) issue(issues, place, "Не указан вид документа", Content.ExtraDoc, doc.id);
    if (!text(doc.caption)) issue(issues, place, "Не указано наименование документа", Content.ExtraDoc, doc.id);
    if (!text(doc.author)) issue(issues, place, "Не указана организация, утвердившая документ", Content.ExtraDoc, doc.id);
  }
  if (!dossier.isDocRule) {
    issue(issues, "Сведения о работе > Перечень документов", "Не подтверждена правоспособность представленных документов", Content.ExtraDoc);
  }
}

function checkGoods(issues: CheckIssue[], dossier: MilitaryDossier) {
  if (dossier.goods.length === 0) {
    issue(issues, "Продукция", "Отсутствуют объекты экспертизы", Content.GoodList);
    return;
  }
  for (const good of dossier.goods) {
    const dataPlace = `Продукция > Объект № ${good.rowNum} > Регистрационные данные`;
    if (!text(good.nameCon)) issue(issues, dataPlace, "Не указано коммерческое наименование", Content.GoodData, good.id);
    if (!text(good.nameDec) && !good.isNotDec) issue(issues, dataPlace, "Не указано обозначение", Content.GoodData, good.id);
    const tnved = good.tnved.trim().replaceAll("'", "");
    if (!text(tnved)) issue(issues, dataPlace, "Не указан код ТН ВЭД", Content.GoodData, good.id);
    if (good.typeId == null) issue(issues, dataPlace, "Не указан вид объекта", Content.GoodData, good.id);
    if (!text(good.area) && !text(dossier.goodArea)) issue(issues, dataPlace, "Не указана область применения", Content.GoodData, good.id);
    if (!text(good.used) && !text(dossier.goodUsed)) issue(issues, dataPlace, "Не указано назначение", Content.GoodData, good.id);
    if (!text(good.description)) issue(issues, dataPlace, "Отсутствует техническое описание", Content.GoodData, good.id);
    const analysis = `Продукция > Объект № ${good.rowNum} > Анализ`;
    if (good.civilDocs.length === 0) {
      issue(issues, analysis, "Отсутствуют документы, подтверждающие гражданское назначение", Content.GoodSummary, good.id);
    }
    if (!text(good.summary)) {
      issue(issues, analysis, "Отсутствуют выводы по принадлежности к продукции гражданского назначения", Content.GoodSummary, good.id);
    }
  }
}

function checkDecision(issues: CheckIssue[], dossier: MilitaryDossier) {
  if (!text(dossier.summary)) issue(issues, "Решение по анализу", "Отсутствуют выводы экспертизы", Content.Summary);
  if (!text(dossier.comment)) issue(issues, "Решение по анализу", "Отсутствуют пояснения эксперта", Content.Summary);
}

export function militarySendBlockers(dossier: MilitaryDossier, work: Work): string[] {
  const blockers: string[] = [];
  if ((work.condition as string) === "query") {
    blockers.push("Работы в состоянии \"Запрос\" на утверждение не отправляются.");
  }
  if (checkMilitary(dossier).length > 0) blockers.push("В работе обнаружены ошибки.");
  if (!text(dossier.project1)) {
    blockers.push("В работе отсутствует проект заключения. Создайте проект заключения.");
  }
  if (dossier.projectsStale) {
    blockers.push("Данные работы были изменены после создания проектов заключений.\nСоздайте новые проекты заключений.");
  }
  return blockers;
}

function good(id: number, rowNum: number, nameCon: string, nameDec: string): MilitaryGood {
  return {
    id,
    rowNum,
    nameCon,
    nameDec,
    isNotDec: false,
    typeId: 1,
    tnved: "850440",
    cas: "",
    area: "Промышленное электропитание",
    used: "Питание станочного оборудования",
    description: "Изделие общепромышленного исполнения.",
    summary: "Относится к продукции гражданского назначения.",
    civilDocs: [{
      id: id * 10,
      rowNum: 1,
      caption: `Паспорт ${nameDec}`,
      regNum: `ПС-${nameDec}`,
      regDate: "2026-01-15",
    }],
    lawPoints: [{
      id: id,
      description: "Локальная строка классификатора ПВН, не запрос к базе.",
      selected: true,
    }],
  };
}

function completeDossier(workId: number, description: string, comment: string): MilitaryDossier {
  return {
    workId,
    description,
    matCount: 2,
    infCount: 0,
    addWorkCount: 0,
    langCount: 0,
    urgencyId: 1,
    complexity: "1",
    changeSourceId: 0,
    isSendQuery: false,
    isMakeProfile: false,
    planeComment: "",
    goodArea: "Промышленное электропитание",
    goodUsed: "Питание станочного оборудования",
    member: {
      id: 1,
      nameLong: "ООО «Ладогамаш»",
      nameShort: "Ладогамаш",
      kind: "ООО",
      inn: "7801456789",
      kpp: "780101001",
      addressLegalFull: "190000, Санкт-Петербург, ул. Промышленная, д. 5",
      addressLegalCountry: "Россия",
      addressLegalTown: "Санкт-Петербург",
    },
    contractCaption: "Договор поставки ЛД-540 от 12.01.2026",
    goods: [
      good(1, 1, "Блок питания промышленный", "БП-540"),
      good(2, 2, "Модуль индикации", "МИ-2"),
    ],
    summary: "Объекты относятся к продукции гражданского назначения.",
    comment,
    isDocRule: true,
    documents: [{
      id: 1,
      rowNum: 1,
      docType: "Паспорт",
      caption: "Паспорт блока питания БП-540",
      author: "ООО «Ладогамаш»",
      used: true,
    }],
    project1: "Проект заключения по блоку питания промышленному.",
    projectsStale: false,
    requests: [],
  };
}

export function createMilitaryDossiers(): Record<number, MilitaryDossier> {
  return {
    18540: completeDossier(18540, "Блок питания промышленный", "Запрос у заказчика, срок приостановлен до ответа."),
  };
}

export function cloneMilitary(dossier: MilitaryDossier): MilitaryDossier {
  return structuredClone(dossier);
}
