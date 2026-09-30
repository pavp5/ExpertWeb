/** Заявка на услуги: Cprp.DxData.Work.Order.WorkUserControl. */

import type { Work } from "./domain.ts";

/** Подписи видов из GetHtmlWorkCaption. Справочник WorkTypeDataTable не подключён. */
export const ORDER_WORK_TYPES: { id: number; label: string }[] = [
  { id: 1, label: "Идентификационная экспертиза по экспортному контролю" },
  { id: 2, label: "Экспертиза по гражданскому назначению" },
  { id: 3, label: "Экспертиза по запретам и ограничениям ЕАЭС" },
  { id: 4, label: "Подтверждение лицензии" },
  { id: 5, label: "Определение кода ТН ВЭД" },
  { id: 6, label: "Консультация по ВЭД" },
  { id: 7, label: "Оформление лицензии ФСТЭК / разрешения КЭК" },
  { id: 117, label: "Рассмотрение заявки на внесение изменений" },
];

/** Локальные строки вместо ExpertDataTable и ManagerDataTable. */
export const ORDER_EXPERTS: { id: number; name: string }[] = [
  { id: 17, name: "Эксперт (демо)" },
];

export const ORDER_MANAGERS: { id: number; name: string }[] = [
  { id: 1, name: "Громов А.С." },
  { id: 2, name: "Орлова Н.И." },
];

export interface OrderService {
  id: number;
  typeId: number | null;
  expertId: number | null;
  managerId: number | null;
}

export interface OrderDocument {
  id: number;
  caption: string;
}

export interface OrderDossier {
  workId: number;
  /** CommentMemoEdit: одно указание на все новые работы. Привязка к строке в источнике закомментирована. */
  instruction: string;
  services: OrderService[];
  documents: OrderDocument[];
}

export function orderAcceptWarning(services: readonly OrderService[]): string | null {
  if (services.length === 0) {
    return "Работы не выбраны. Выберите работы, необходимые для исполнения заказа.";
  }
  if (services.some((row) => row.typeId == null)) {
    return "У выбранной работы отсутствует вид работы. Укажите вид работы.";
  }
  return null;
}

export const ORDER_ACCEPT_QUESTION = "Утвердить перечень работ и создать по ним новые работы?";
export const ORDER_ALREADY_CLOSED = "Заявка распределена другим сотрудником.";

export function orderWorkCaption(work: Work): string {
  const state = work.condition === "work"
    ? "В работе"
    : work.condition === "close"
      ? "Закрыта"
      : work.condition === "cancel"
        ? "Аннулирована"
        : work.conditionName;
  return `№ ${work.id} / Рассмотрение заявки на оказание услуг / ${state}`;
}

function emptyDossier(workId: number): OrderDossier {
  return {
    workId,
    instruction: "",
    services: [],
    documents: [{ id: 1, caption: "Заявка на оказание услуг по комплекту крепежа" }],
  };
}

export function createOrderDossiers(): Record<number, OrderDossier> {
  return { 18402: emptyDossier(18402) };
}

export function cloneOrderDossier(dossier: OrderDossier): OrderDossier {
  return structuredClone(dossier);
}
