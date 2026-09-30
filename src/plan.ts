import {
  LICENSE_STAGE_LABEL,
  WORK_TYPE_SID,
  type Work,
  type WorkCondition,
} from "./domain.ts";

export interface PlanRow {
  work: Work;
  sId: string;
  groupText: string;
  conditionLabel: string;
  isExpired: boolean;
}

export interface PlanSummary {
  total: number;
  expired: number;
  laborMinutes: number;
}

const EXCLUDED: WorkCondition[] = ["accept", "close", "cancel"];
const EXPIRY_GRACE_MS = 30 * 60 * 1000;

/**
 * Правила плана из Expert/PlaneUserControl.vb (DataReload):
 * фильтр эксперта и состояний, группы, пояснения к состоянию, просрочка, трудоёмкость.
 */
export function buildPlan(
  works: readonly Work[],
  expertId: number,
  showAgree: boolean,
  now: Date,
): { rows: PlanRow[]; summary: PlanSummary } {
  const hidden = new Set<WorkCondition>(EXCLUDED);
  if (!showAgree) hidden.add("agree");

  let expired = 0;
  let laborMinutes = 0;
  const rows: PlanRow[] = [];
  const expiryBefore = now.getTime() - EXPIRY_GRACE_MS;

  for (const work of works) {
    if (work.expertId !== expertId || hidden.has(work.condition)) continue;

    let groupText = "2. В работе";
    if (work.condition === "signature") {
      groupText = "1. Подписание";
    } else if (work.condition === "agree") {
      groupText = "3. Утверждение";
    } else if (work.totalWork != null) {
      laborMinutes += work.totalWork;
    }

    const termMs = work.expertTerm ? Date.parse(work.expertTerm) : Number.NaN;
    let isExpired = false;
    const terminal =
      work.condition === "accept" ||
      work.condition === "close" ||
      work.condition === "cancel";
    if (
      !Number.isNaN(termMs) &&
      !terminal &&
      termMs < expiryBefore &&
      !work.isAskSend &&
      !work.isStop &&
      work.type !== "license"
    ) {
      isExpired = true;
      expired += 1;
    }

    let suffix = "";
    if (work.isAskSign) {
      suffix = " (подписание запроса)";
      groupText = "1. Подписание";
    } else if (work.isAsk) {
      suffix = " (утверждение запроса)";
    } else if (work.isAskSend) {
      suffix = " (направлен запрос)";
    } else if (work.isStop) {
      suffix = " (остановлена)";
    }
    if (work.isInt) suffix = " (утверждение документа)";
    if (suffix.trim() === "" && work.type === "license" && work.licConditionId) {
      suffix = ` (${LICENSE_STAGE_LABEL[work.licConditionId]})`;
    }

    rows.push({
      work,
      sId: WORK_TYPE_SID[work.type],
      groupText,
      conditionLabel: `${work.conditionName}${suffix}`,
      isExpired,
    });
  }

  rows.sort((a, b) => {
    if (a.groupText !== b.groupText) {
      return a.groupText < b.groupText ? -1 : 1;
    }
    const left = a.work.expertTerm ? Date.parse(a.work.expertTerm) : Number.POSITIVE_INFINITY;
    const right = b.work.expertTerm ? Date.parse(b.work.expertTerm) : Number.POSITIVE_INFINITY;
    if (left !== right) return left - right;
    return a.work.id - b.work.id;
  });

  return {
    rows,
    summary: { total: rows.length, expired, laborMinutes },
  };
}

export function formatSummary(summary: PlanSummary): string {
  const hours = Math.floor(summary.laborMinutes / 60);
  const minutes = summary.laborMinutes % 60;
  return `Весь план: ${summary.total}. Просрочено: ${summary.expired}. Суммарная трудоемкость: ${hours} ч. ${minutes} мин.`;
}

export function formatDateTime(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function groupRows(rows: readonly PlanRow[]): { groupText: string; rows: PlanRow[] }[] {
  const groups: { groupText: string; rows: PlanRow[] }[] = [];
  for (const row of rows) {
    const last = groups[groups.length - 1];
    if (!last || last.groupText !== row.groupText) {
      groups.push({ groupText: row.groupText, rows: [row] });
    } else {
      last.rows.push(row);
    }
  }
  return groups;
}
