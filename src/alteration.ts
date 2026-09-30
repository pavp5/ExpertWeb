/** Карточка изменения: Cprp.DxData.Work.Alteration. */

import type { Work } from "./domain.ts";

export const Content = {
  Content: 10,
  Plane: 20,
  ExtraDoc: 130,
  Project: 140,
  Request: 150,
} as const;

export interface AlterationDocument {
  id: number;
  caption: string;
}

export interface AlterationNote {
  id: number;
  caption: string;
  text: string;
}

export interface AlterationDossier {
  workId: number;
  leaderComment: string;
  expertComment: string;
  /** changeSummaryId из HTML плана. На форме плана отдельного поля нет. */
  changeSummaryId: number;
  isSendQuery: boolean;
  documents: AlterationDocument[];
  letter: string;
  requests: AlterationNote[];
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

/** ContentDataTable.DataReload: в дереве только план. */
export function buildAlterationTree(): { id: number; parentId: null; contentId: number; objectId: number; caption: string }[] {
  return [{ id: Content.Plane, parentId: null, contentId: Content.Plane, objectId: 0, caption: "ПЛАН РАБОТЫ" }];
}

/**
 * CheckWork вызывает только CheckPlane.
 * Проверка наименования и причины изменений в источнике закомментирована.
 * Кнопка ПРОВЕРИТЬ видна только в состояниях плана.
 */
export function checkAlteration(dossier: AlterationDossier, work: Work): CheckIssue[] {
  const issues: CheckIssue[] = [];
  if (!text(dossier.expertComment)) {
    issues.push({
      place: "План работы",
      description: "Не указаны пояснения эксперта",
      contentId: Content.Plane,
      objectId: 0,
    });
  }
  if (work.totalWork == null || work.totalWork === 0) {
    issues.push({
      place: "План работы",
      description: "Не указана трудоемкость",
      contentId: Content.Plane,
      objectId: 0,
    });
  }
  if (!work.expertTerm) {
    issues.push({
      place: "План работы",
      description: "Не указан срок исполнения",
      contentId: Content.Plane,
      objectId: 0,
    });
  }
  if (dossier.isSendQuery && !work.isAsk && !work.isAskSign && !work.isAskSend) {
    issues.push({
      place: "План работы",
      description: "Необходимо подготовить и направить на утверждение запрос",
      contentId: Content.Plane,
      objectId: 0,
    });
  }
  return issues;
}

/** ExpertWorkSend не вызывает CheckWork. Нужен только проект письма. */
export function alterationSendBlockers(dossier: AlterationDossier, work: Work): string[] {
  const blockers: string[] = [];
  if ((work.condition as string) === "query") {
    blockers.push("Работы в состоянии \"Запрос\" на утверждение не отправляются.");
  }
  if (!text(dossier.letter)) {
    blockers.push("В работе отсутствует проект письма. Создайте проект письма.");
  }
  return blockers;
}

/** HtmlPlaneTABLE: 1 разблокировать, 2 новая работа, 3 письмо. Иные коды — «[нет данных]». */
export function changeSummaryLabel(id: number): string {
  if (id === 1) return "Разблокировать старую работу";
  if (id === 2) return "Создать новую работу";
  if (id === 3) return "Подготовить письмо";
  return "[нет данных]";
}

export function alterationWorkCaption(work: Work): string {
  const state = work.condition === "work"
    ? "В работе"
    : work.condition === "agree"
      ? "Утверждение"
      : work.conditionName;
  return `№ ${work.id} / Рассмотрение заявки на внесение изменений / ${state}`;
}

export function createAlterationDossiers(): Record<number, AlterationDossier> {
  return {
    18471: {
      workId: 18471,
      leaderComment: "Рассмотреть изменение заключения по насосу.",
      expertComment: "Изменение касается обозначения насоса в ранее выданном заключении.",
      changeSummaryId: 3,
      isSendQuery: false,
      documents: [{ id: 1, caption: "Заявка на внесение изменений в заключение по насосу" }],
      letter: "Проект письма о внесении изменений в заключение по насосу.",
      requests: [],
    },
  };
}

export function cloneAlteration(dossier: AlterationDossier): AlterationDossier {
  return structuredClone(dossier);
}
