/** Карточка кода ТН ВЭД: Cprp.DxData.Work.Tnved, ContentDataTable.DataReload и ErrorDataTable.CheckWork. */

import type { Work } from "./domain.ts";

export const Content = {
  Content: 10,
  Plane: 20,
  GoodList: 100,
  GoodData: 101,
  ExtraDoc: 130,
  Project: 140,
  Request: 150,
} as const;

/** UrgencyType из Cprp.DxData.Work Enum.vb. */
export const URGENCY: { id: number; label: string }[] = [
  { id: 1, label: "Без срочности (16 рабочих часов)" },
  { id: 2, label: "Повышенная (8 рабочих часов)" },
  { id: 3, label: "Срочная (4 рабочих часа)" },
];

/** Локальная строка справочника GoodTypeHandbookTable: id и codeName. Каталог SQL не подключён. */
export const GOOD_TYPES: { id: number; codeName: string }[] = [
  { id: 1, codeName: "Готовое изделие" },
];

/** PlaneChildControl: FreeWorkookUpEdit пишет changeSourceId = 4. */
export const FREE_WORK_SOURCE = 4;

export interface TnvedGood {
  id: number;
  rowNum: number;
  nameCon: string;
  nameDec: string;
  isNotDec: boolean;
  typeId: number | null;
  tnved: string;
  cas: string;
  tnvedComment: string;
  area: string;
  used: string;
  description: string;
}

export interface TnvedDocument {
  id: number;
  rowNum: number;
  caption: string;
  regNum: string;
  regDate: string;
  used: boolean;
}

export interface TnvedNote {
  id: number;
  caption: string;
  text: string;
}

export interface TnvedDossier {
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
  goods: TnvedGood[];
  isDocRule: boolean;
  documents: TnvedDocument[];
  project1: string;
  projectsStale: boolean;
  requests: TnvedNote[];
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

/** Дерево ContentDataTable.DataReload: только план и продукция. */
export function buildTnvedTree(dossier: TnvedDossier): ContentNode[] {
  const nodes: ContentNode[] = [];
  nodes.push({ id: Content.Plane, parentId: null, contentId: Content.Plane, objectId: 0, caption: "ПЛАН РАБОТЫ" });
  nodes.push({
    id: Content.GoodList,
    parentId: null,
    contentId: Content.GoodList,
    objectId: 0,
    caption: "ПРОДУКЦИЯ (ОБЪЕКТЫ ЭКСПЕРТИЗЫ)",
  });
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
  return nodes;
}

function issue(issues: CheckIssue[], place: string, description: string, contentId: number, objectId = 0) {
  issues.push({ place, description, contentId, objectId });
}

/**
 * CheckWork для обычной работы: описание, перечень документов, объекты.
 * Проверка плана (IsPlaneWork / IsPlaneAgree) не вызывается.
 * COUNT по tTnved не выполняется: справочника нет, непустой код не считается ошибкой номенклатуры.
 */
export function checkTnved(dossier: TnvedDossier): CheckIssue[] {
  const issues: CheckIssue[] = [];
  if (!text(dossier.description)) {
    issue(issues, "Сведения о работе > Продукция", "Не указано обобщенное наименование объектов экспертизы", Content.Content);
  }
  const usedDocs = dossier.documents.filter((doc) => doc.used);
  if (usedDocs.length === 0) {
    issue(issues, "Сведения о работе > Перечень документов", "Отсутствуют документы, использованные при проведении экспертизы", Content.ExtraDoc);
  } else {
    for (const doc of [...usedDocs].sort((a, b) => a.rowNum - b.rowNum)) {
      if (!text(doc.caption)) {
        issue(
          issues,
          `Сведения о работе > Перечень документов > Объект № ${doc.rowNum}`,
          "Не указано наименование или краткое содержание документа",
          Content.ExtraDoc,
          doc.id,
        );
      }
    }
    if (!dossier.isDocRule) {
      issue(issues, "Сведения о работе > Перечень документов", "Не подтверждена правоспособность представленных документов", Content.ExtraDoc);
    }
  }
  if (dossier.goods.length === 0) {
    issue(issues, "Продукция", "Отсутствуют объекты экспертизы", Content.GoodList);
  }
  for (const good of dossier.goods) {
    const place = `Продукция > Объект № ${good.rowNum} > Регистрационные данные`;
    if (!text(good.nameCon)) issue(issues, place, "Не указано коммерческое наименование", Content.GoodData, good.id);
    if (!text(good.nameDec) && !good.isNotDec) issue(issues, place, "Не указано обозначение", Content.GoodData, good.id);
    const tnved = good.tnved.replaceAll("'", "").trim();
    if (!tnved) issue(issues, place, "Не указан код ТН ВЭД", Content.GoodData, good.id);
    if (tnved && !text(good.tnvedComment)) {
      issue(issues, place, "Отсутствует обоснование кода ТН ВЭД", Content.GoodData, good.id);
    }
    if (good.typeId == null) issue(issues, place, "Не указан вид объекта", Content.GoodData, good.id);
    if (!text(good.area) && !text(dossier.goodArea)) issue(issues, place, "Не указана область применения", Content.GoodData, good.id);
    if (!text(good.used) && !text(dossier.goodUsed)) issue(issues, place, "Не указано назначение", Content.GoodData, good.id);
    if (!text(good.description)) issue(issues, place, "Отсутствует техническое описание", Content.GoodData, good.id);
  }
  return issues;
}

export function tnvedSendBlockers(dossier: TnvedDossier, work: Work): string[] {
  const blockers: string[] = [];
  if ((work.condition as string) === "query") {
    blockers.push("Работы в состоянии \"Запрос\" на утверждение не отправляются.");
  }
  if (checkTnved(dossier).length > 0) blockers.push("В работе обнаружены ошибки.");
  if (!text(dossier.project1)) {
    blockers.push("В работе отсутствует проект заключения. Создайте проект заключения.");
  }
  if (dossier.projectsStale) {
    blockers.push("Данные работы были изменены после создания проектов заключений.\nСоздайте новые проекты заключений.");
  }
  return blockers;
}

function completeDossier(workId: number, description: string): TnvedDossier {
  return {
    workId,
    description,
    matCount: 1,
    infCount: 0,
    addWorkCount: 0,
    langCount: 0,
    urgencyId: 1,
    complexity: "1",
    changeSourceId: 0,
    isSendQuery: false,
    isMakeProfile: false,
    planeComment: "Код уточняется по описанию изготовителя.",
    goodArea: "",
    goodUsed: "",
    goods: [
      {
        id: 1,
        rowNum: 1,
        nameCon: "Плата управления",
        nameDec: "ПУ-10455",
        isNotDec: false,
        typeId: 1,
        tnved: "8537109100",
        cas: "",
        tnvedComment: "Пульт управления электрический на напряжение не более 1000 В",
        area: "Промышленный электропривод",
        used: "Управление приводом",
        description: "Плата управления приводом, питание 24 В.",
      },
    ],
    isDocRule: true,
    documents: [
      {
        id: 1,
        rowNum: 1,
        caption: "Техническое описание изготовителя платы управления",
        regNum: "ТО-10455",
        regDate: "2026-03-12",
        used: true,
      },
    ],
    project1: "Проект заключения по коду ТН ВЭД платы управления.",
    projectsStale: false,
    requests: [],
  };
}

export function createTnvedDossiers(): Record<number, TnvedDossier> {
  return {
    18455: completeDossier(18455, "Плата управления приводом"),
  };
}

export function cloneTnved(dossier: TnvedDossier): TnvedDossier {
  return structuredClone(dossier);
}
