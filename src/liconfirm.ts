/** Карточка подтверждения лицензии: Cprp.DxData.Work.Liconfirm. */

import type { Work } from "./domain.ts";

export const Content = {
  Content: 10,
  Plane: 20,
  License: 30,
  GoodList: 100,
  GoodData: 101,
  GoodLaw: 104,
  ExtraInfo: 120,
  ExtraDoc: 130,
  Project: 140,
  Request: 150,
} as const;

export const URGENCY: { id: number; label: string }[] = [
  { id: 1, label: "Без срочности (16 рабочих часов)" },
  { id: 2, label: "Повышенная (8 рабочих часов)" },
  { id: 3, label: "Срочная (4 рабочих часа)" },
];

/** Локальная строка GoodCategoryHandbookTable. Каталог SQL не подключён. */
export const GOOD_CATEGORIES: { id: number; codeName: string }[] = [
  { id: 1, codeName: "Готовое изделие" },
];

/** PlaneChildControl: флажок «Без оплаты» пишет changeSourceId = 4. */
export const FREE_WORK_SOURCE = 4;

export interface LicenseRow {
  id: number;
  regNumCaption: string;
  description: string;
  contractName: string;
  countryName: string;
  rusName: string;
  nusName: string;
  endName: string;
}

export interface LicenseAppend {
  id: number;
  licId: number;
  pos: number;
  stage: string;
  description: string;
}

export interface LiconfirmGood {
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
  goodDescription: string;
  appendIds: number[];
}

export interface LiconfirmDocument {
  id: number;
  rowNum: number;
  caption: string;
  regNum: string;
  regDate: string;
  used: boolean;
}

export interface LiconfirmNote {
  id: number;
  caption: string;
  text: string;
}

export interface LiconfirmDossier {
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
  licId: number | null;
  licenses: LicenseRow[];
  appends: LicenseAppend[];
  goods: LiconfirmGood[];
  comment: string;
  isDocRule: boolean;
  documents: LiconfirmDocument[];
  project1: string;
  projectsStale: boolean;
  requests: LiconfirmNote[];
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

/** ContentDataTable.DataReload: план, лицензия, продукция, дополнительная информация. */
export function buildLiconfirmTree(dossier: LiconfirmDossier): ContentNode[] {
  const nodes: ContentNode[] = [
    { id: Content.Plane, parentId: null, contentId: Content.Plane, objectId: 0, caption: "ПЛАН РАБОТЫ" },
    { id: Content.License, parentId: null, contentId: Content.License, objectId: 0, caption: "СВЕДЕНИЯ О ЛИЦЕНЗИИ" },
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
  nodes.push({
    id: Content.ExtraInfo,
    parentId: null,
    contentId: Content.ExtraInfo,
    objectId: 0,
    caption: "ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ",
  });
  return nodes;
}

function issue(issues: CheckIssue[], place: string, description: string, contentId: number, objectId = 0) {
  issues.push({ place, description, contentId, objectId });
}

/**
 * CheckWork для обычной работы.
 * Если лицензия не выбрана, CheckLicense возвращает управление сразу: объекты дальше не проверяются.
 * Проверка обоснования кода ТН ВЭД в источнике закомментирована.
 * COUNT по tTnved не выполняется.
 */
export function checkLiconfirm(dossier: LiconfirmDossier): CheckIssue[] {
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
  if (dossier.licId == null) {
    issue(issues, "Лицензия", "Не выбрана лицензия", Content.License);
    return issues;
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
    if (good.typeId == null) issue(issues, place, "Не указан вид объекта", Content.GoodData, good.id);
    if (!text(good.area) && !text(dossier.goodArea)) issue(issues, place, "Не указана область применения", Content.GoodData, good.id);
    if (!text(good.used) && !text(dossier.goodUsed)) issue(issues, place, "Не указано назначение", Content.GoodData, good.id);
    if (!text(good.description)) issue(issues, place, "Отсутствует техническое описание", Content.GoodData, good.id);
    const law = `Продукция > Объект № ${good.rowNum} > Проверка соответствия`;
    if (good.appendIds.length === 0) {
      issue(issues, law, "Не выбраны пункты приложения к лицензии", Content.GoodLaw, good.id);
    } else if (!text(good.goodDescription)) {
      issue(issues, law, "Не указаны технические характеристики для сравнения с пунктами приложения к лицензии", Content.GoodLaw, good.id);
    }
  }
  return issues;
}

export function liconfirmSendBlockers(dossier: LiconfirmDossier, work: Work): string[] {
  const blockers: string[] = [];
  if ((work.condition as string) === "query") {
    blockers.push("Работы в состоянии \"Запрос\" на утверждение не отправляются.");
  }
  if (checkLiconfirm(dossier).length > 0) blockers.push("В работе обнаружены ошибки.");
  if (!text(dossier.project1)) {
    blockers.push("В работе отсутствует проект заключения. Создайте проект заключения.");
  }
  if (dossier.projectsStale) {
    blockers.push("Данные работы были изменены после создания проектов заключений.\nСоздайте новые проекты заключений.");
  }
  return blockers;
}

function completeDossier(workId: number, description: string): LiconfirmDossier {
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
    planeComment: "",
    goodArea: "",
    goodUsed: "",
    licId: 502,
    licenses: [
      {
        id: 502,
        regNumCaption: "Л-502/26 от 15.01.2026 (вывоз комплектующих)",
        description: "Вывоз электронных комплектующих по ранее выданной лицензии",
        contractName: "Контракт БК-12/25",
        countryName: "Казахстан",
        rusName: "АО «Балткомплект»",
        nusName: "Astana Trade LLP",
        endName: "Astana Trade LLP",
      },
    ],
    appends: [
      { id: 1, licId: 502, pos: 1, stage: "1", description: "Электронные компоненты управления" },
      { id: 2, licId: 502, pos: 2, stage: "1", description: "Запасные части к ним" },
    ],
    goods: [
      {
        id: 1,
        rowNum: 1,
        nameCon: "Модуль управления",
        nameDec: "МУ-502",
        isNotDec: false,
        typeId: 1,
        tnved: "8537109100",
        cas: "",
        tnvedComment: "",
        area: "Промышленная автоматика",
        used: "Управление приводом",
        description: "Модуль управления, питание 24 В.",
        goodDescription: "Напряжение питания 24 В, промышленное исполнение.",
        appendIds: [1],
      },
    ],
    comment: "",
    isDocRule: true,
    documents: [
      {
        id: 1,
        rowNum: 1,
        caption: "Копия лицензии Л-502/26 и спецификация",
        regNum: "Л-502/26",
        regDate: "2026-01-15",
        used: true,
      },
    ],
    project1: "Проект заключения о подтверждении ранее выданной лицензии.",
    projectsStale: false,
    requests: [],
  };
}

export function createLiconfirmDossiers(): Record<number, LiconfirmDossier> {
  return {
    18502: completeDossier(18502, "Подтверждение ранее выданного заключения"),
  };
}

export function cloneLiconfirm(dossier: LiconfirmDossier): LiconfirmDossier {
  return structuredClone(dossier);
}
