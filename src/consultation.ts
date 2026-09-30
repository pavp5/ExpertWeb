/** Карточка консультации: Cprp.DxData.Work.Consultation. */

import type { Work } from "./domain.ts";

export const Content = {
  Content: 10,
  Plane: 20,
  QueryList: 100,
  QueryData: 101,
  ExtraDoc: 130,
  Project: 140,
  Request: 150,
} as const;

export const URGENCY: { id: number; label: string }[] = [
  { id: 1, label: "Без срочности (16 рабочих часов)" },
  { id: 2, label: "Повышенная (8 рабочих часов)" },
  { id: 3, label: "Срочная (4 рабочих часа)" },
];

/** PlaneChildControl: флажок «Без оплаты» пишет changeSourceId = 4. */
export const FREE_WORK_SOURCE = 4;

export interface ConsultationQuery {
  id: number;
  rowNum: number;
  ask: string;
  ans: string;
}

export interface ConsultationDocument {
  id: number;
  rowNum: number;
  caption: string;
  regNum: string;
  regDate: string;
  used: boolean;
}

export interface ConsultationNote {
  id: number;
  caption: string;
  text: string;
}

export interface ConsultationDossier {
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
  queries: ConsultationQuery[];
  isDocRule: boolean;
  documents: ConsultationDocument[];
  project1: string;
  projectsStale: boolean;
  requests: ConsultationNote[];
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

/** ContentDataTable.DataReload: только план и поставленные вопросы. */
export function buildConsultationTree(dossier: ConsultationDossier): ContentNode[] {
  const nodes: ContentNode[] = [
    { id: Content.Plane, parentId: null, contentId: Content.Plane, objectId: 0, caption: "ПЛАН РАБОТЫ" },
    { id: Content.QueryList, parentId: null, contentId: Content.QueryList, objectId: 0, caption: "ПОСТАВЛЕННЫЕ ВОПРОСЫ" },
  ];
  for (const query of [...dossier.queries].sort((a, b) => a.rowNum - b.rowNum)) {
    const ask = query.ask.trim() || "[нет формулировки вопроса]";
    nodes.push({
      id: 1000 + nodes.length,
      parentId: Content.QueryList,
      contentId: Content.QueryData,
      objectId: query.id,
      caption: `${query.rowNum}. ${ask}`,
    });
  }
  return nodes;
}

function issue(issues: CheckIssue[], place: string, description: string, contentId: number, objectId = 0) {
  issues.push({ place, description, contentId, objectId });
}

/** CheckWork для обычной работы. CheckPlane вызывается только для состояний плана. */
export function checkConsultation(dossier: ConsultationDossier): CheckIssue[] {
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
  if (dossier.queries.length === 0) {
    issue(issues, "Вопросы и ответы", "Отсутствуют вопросы", Content.QueryList);
  }
  for (const query of dossier.queries) {
    const place = `Вопросы и ответы > Объект № ${query.rowNum}`;
    if (!text(query.ask)) issue(issues, place, "Не указан вопрос", Content.QueryData, query.id);
    if (!text(query.ans)) issue(issues, place, "Не указан ответ", Content.QueryData, query.id);
  }
  return issues;
}

export function consultationSendBlockers(dossier: ConsultationDossier, work: Work): string[] {
  const blockers: string[] = [];
  if ((work.condition as string) === "query") {
    blockers.push("Работы в состоянии \"Запрос\" на утверждение не отправляются.");
  }
  if (checkConsultation(dossier).length > 0) blockers.push("В работе обнаружены ошибки.");
  if (!text(dossier.project1)) {
    blockers.push("В работе отсутствует проект заключения. Создайте проект заключения.");
  }
  if (dossier.projectsStale) {
    blockers.push("Данные работы были изменены после создания проектов заключений.\nСоздайте новые проекты заключений.");
  }
  return blockers;
}

function completeDossier(workId: number, description: string): ConsultationDossier {
  return {
    workId,
    description,
    matCount: 1,
    infCount: 0,
    addWorkCount: 0,
    langCount: 0,
    urgencyId: 1,
    complexity: "1",
    changeSourceId: FREE_WORK_SOURCE,
    isSendQuery: false,
    isMakeProfile: false,
    planeComment: "",
    queries: [
      {
        id: 1,
        rowNum: 1,
        ask: "Относится ли комплект датчиков к товарам, подлежащим экспортному контролю",
        ans: "Для ответа нужны обозначение и область применения комплекта.",
      },
    ],
    isDocRule: true,
    documents: [
      {
        id: 1,
        rowNum: 1,
        caption: "Запрос заказчика по комплекту датчиков",
        regNum: "ЗК-10312",
        regDate: "2026-09-01",
        used: true,
      },
    ],
    project1: "Проект консультационного заключения по комплекту датчиков.",
    projectsStale: false,
    requests: [],
  };
}

export function createConsultationDossiers(): Record<number, ConsultationDossier> {
  return {
    18312: completeDossier(18312, "Консультация по комплекту датчиков"),
  };
}

export function cloneConsultation(dossier: ConsultationDossier): ConsultationDossier {
  return structuredClone(dossier);
}
