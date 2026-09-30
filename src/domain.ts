export type WorkType =
  | "excont"
  | "customUnion"
  | "tnved"
  | "liconfirm"
  | "consultation"
  | "military"
  | "alteration"
  | "license"
  | "order";

export type WorkCondition =
  | "new"
  | "work"
  | "signature"
  | "agree"
  | "accept"
  | "close"
  | "cancel";

export type LicenseStage = 1 | 2 | 3 | 4;

export interface Work {
  id: number;
  expertId: number;
  type: WorkType;
  condition: WorkCondition;
  conditionName: string;
  expertTerm: string | null;
  orderTerm: string | null;
  goodCount: number;
  totalWork: number | null;
  orderNum: string;
  orderUrl: string | null;
  clientName: string;
  description: string;
  managerName: string;
  leaderName: string;
  isPayment: boolean;
  comment: string;
  isAsk: boolean;
  isAskSign: boolean;
  isAskSend: boolean;
  isStop: boolean;
  isInt: boolean;
  licConditionId: LicenseStage | null;
}

export const CURRENT_EXPERT = {
  id: 17,
  title: "Эксперт (демо)",
} as const;

/** Краткие подписи вида услуги из PlaneUserControl.DataReload. У IsOrder подписи нет. */
export const WORK_TYPE_SID: Record<WorkType, string> = {
  excont: "ДН",
  customUnion: "ЗиО",
  tnved: "Код",
  liconfirm: "Контр.",
  consultation: "Кон.",
  military: "Граж.",
  alteration: "Измен.",
  license: "Лиценз.",
  order: "",
};

/** Элемент управления, который MainForm.WorkOpen создаёт для вида. Для лицензии ветки нет. */
export const WORK_TYPE_MODULE: Record<WorkType, string | null> = {
  excont: "Cprp.DxData.Work.Excont.WorkUserControl",
  customUnion: "Cprp.DxData.Work.Customs.WorkUserControl",
  tnved: "Cprp.DxData.Work.Tnved.WorkUserControl",
  liconfirm: "Cprp.DxData.Work.Liconfirm.WorkUserControl",
  consultation: "Cprp.DxData.Work.Consultation.WorkUserControl",
  military: "Cprp.DxData.Work.Military.WorkUserControl",
  alteration: "Cprp.DxData.Work.Alteration.WorkUserControl",
  license: null,
  order: "Cprp.DxData.Work.Order.WorkUserControl",
};

export const LICENSE_STAGE_LABEL: Record<LicenseStage, string> = {
  1: "подготовка документов",
  2: "подписание заказчиком",
  3: "направлено в госорган",
  4: "документ получен",
};
