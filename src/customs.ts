/** Карточка ЗиО: Cprp.DxData.Work.Customs, ContentEnum и ErrorDataTable.CheckWork. */

import type { Work } from "./domain.ts";
import { SUPPLY_TYPES } from "./excont.ts";

export { SUPPLY_TYPES };

export const Content = {
  Content: 10,
  Plane: 20,
  ContractData: 31,
  ContractRisk: 35,
  ContractRusList: 40,
  ContractRusData: 41,
  ContractNusList: 50,
  ContractNusData: 51,
  SupplyData: 61,
  SupplyRisk: 65,
  SupplyRusList: 70,
  SupplyRusData: 71,
  SupplyNusList: 80,
  SupplyNusData: 81,
  SupplyEndList: 90,
  SupplyEndData: 91,
  GoodList: 100,
  GoodData: 101,
  GoodLaw: 104,
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

export interface CustomsMember {
  id: number;
  nameLong: string;
  nameShort: string;
  inn: string;
  addressLegalFull: string;
  addressLegalCountry: string;
  addressLegalTown: string;
  conRusNum: number;
  conNusNum: number;
  supRusNum: number;
  supNusNum: number;
  supEndNum: number;
}

export interface CustomsGood {
  id: number;
  rowNum: number;
  nameCon: string;
  nameDec: string;
  isNotDec: boolean;
  tnved: string;
  cas: string;
  tnvedComment: string;
  typeName: string;
  area: string;
  used: string;
  description: string;
  studyDate: string;
}

export interface LawSection {
  id: number;
  pos: string;
  description: string;
}

export interface CustomsDocument {
  id: number;
  rowNum: number;
  caption: string;
  regNum: string;
  regDate: string;
  used: boolean;
}

export interface CustomsNote {
  id: number;
  caption: string;
  text: string;
}

export interface CustomsDossier {
  workId: number;
  description: string;
  matCount: number;
  infCount: number;
  addWorkCount: number;
  langCount: number;
  urgencyId: number;
  complexity: string;
  isSendQuery: boolean;
  isMakeProfile: boolean;
  planeComment: string;
  isNotContract: boolean;
  contractName: string;
  contractNum: string;
  contractDate: string;
  contractTerm: string;
  isNotContractTerm: boolean;
  contractDescription: string;
  isNotContractRisk: boolean;
  supplyTypeId: number | null;
  invoiceCaption: string;
  countryName: string;
  supplyDescription: string;
  incoterms: string;
  incotermsPlace: string;
  isNotSupplyRisk: boolean;
  members: CustomsMember[];
  goods: CustomsGood[];
  sections: LawSection[];
  summaryText: string;
  isDocRule: boolean;
  documents: CustomsDocument[];
  project1: string;
  comments: { p2: string; p3: string; p4: string; p5: string; p6: string };
  projectsStale: boolean;
  requests: CustomsNote[];
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

function memberLabel(member: CustomsMember): string {
  return member.nameLong.trim() || "[нет наименования]";
}

/** Дерево ContentDataTable.DataReload. Дополнительная информация в источнике закомментирована. */
export function buildCustomsTree(dossier: CustomsDossier): ContentNode[] {
  const nodes: ContentNode[] = [];
  const add = (id: number, parentId: number | null, contentId: number, objectId: number, caption: string) => {
    nodes.push({ id, parentId, contentId, objectId, caption });
  };
  add(Content.Plane, null, Content.Plane, 0, "ПЛАН РАБОТЫ");
  add(Content.ContractData, null, Content.ContractData, 0, "ВНЕШНЕЭКОНОМИЧЕСКАЯ СДЕЛКА");
  if (!dossier.isNotContract) {
    add(Content.ContractRusList, Content.ContractData, Content.ContractRusList, 0, "РОССИЙСКИЕ УЧАСТНИКИ СДЕЛКИ");
    for (const member of dossier.members.filter((item) => item.conRusNum > 0).sort((a, b) => a.conRusNum - b.conRusNum)) {
      add(1000 + nodes.length, Content.ContractRusList, Content.ContractRusData, member.id, `${member.conRusNum}. ${memberLabel(member)}`);
    }
    add(Content.ContractNusList, Content.ContractData, Content.ContractNusList, 0, "ИНОСТРАННЫЕ УЧАСТНИКИ СДЕЛКИ");
    for (const member of dossier.members.filter((item) => item.conNusNum > 0).sort((a, b) => a.conNusNum - b.conNusNum)) {
      add(1000 + nodes.length, Content.ContractNusList, Content.ContractNusData, member.id, `${member.conNusNum}. ${memberLabel(member)}`);
    }
  }
  add(Content.SupplyData, null, Content.SupplyData, 0, "ВНЕШНЕЭКОНОМИЧЕСКАЯ ОПЕРАЦИЯ");
  add(Content.SupplyRusList, Content.SupplyData, Content.SupplyRusList, 0, "РОССИЙСКИЕ УЧАСТНИКИ ОПЕРАЦИИ");
  for (const member of dossier.members.filter((item) => item.supRusNum > 0).sort((a, b) => a.supRusNum - b.supRusNum)) {
    add(1000 + nodes.length, Content.SupplyRusList, Content.SupplyRusData, member.id, `${member.supRusNum}. ${memberLabel(member)}`);
  }
  add(Content.SupplyNusList, Content.SupplyData, Content.SupplyNusList, 0, "ИНОСТРАННЫЕ ПОКУПАТЕЛИ (ПРОДАВЦЫ)");
  for (const member of dossier.members.filter((item) => item.supNusNum > 0).sort((a, b) => a.supNusNum - b.supNusNum)) {
    add(1000 + nodes.length, Content.SupplyNusList, Content.SupplyNusData, member.id, `${member.supNusNum}. ${memberLabel(member)}`);
  }
  add(Content.SupplyEndList, Content.SupplyData, Content.SupplyEndList, 0, "ПОТРЕБИТЕЛИ (КОНЕЧНЫЕ ПОЛЬЗОВАТЕЛИ)");
  for (const member of dossier.members.filter((item) => item.supEndNum > 0).sort((a, b) => a.supEndNum - b.supEndNum)) {
    add(1000 + nodes.length, Content.SupplyEndList, Content.SupplyEndData, member.id, `${member.supEndNum}. ${memberLabel(member)}`);
  }
  add(Content.GoodList, null, Content.GoodList, 0, "ПРОДУКЦИЯ (ОБЪЕКТЫ ЭКСПЕРТИЗЫ)");
  for (const good of [...dossier.goods].sort((a, b) => a.rowNum - b.rowNum)) {
    const name = good.nameCon.trim() || "[нет наименования]";
    add(1000 + nodes.length, Content.GoodList, Content.GoodData, good.id, `${good.rowNum}. ${name}`);
  }
  add(Content.Summary, null, Content.Summary, 0, "РЕШЕНИЕ ПО АНАЛИЗУ");
  return nodes;
}

function issue(issues: CheckIssue[], place: string, description: string, contentId: number, objectId = 0) {
  issues.push({ place, description, contentId, objectId });
}

type MemberKind = "conRus" | "conNus" | "supRus" | "supNus" | "supEnd";

function checkMemberData(issues: CheckIssue[], member: CustomsMember, kind: MemberKind) {
  const number =
    kind === "conRus" ? member.conRusNum :
    kind === "conNus" ? member.conNusNum :
    kind === "supRus" ? member.supRusNum :
    kind === "supNus" ? member.supNusNum :
    member.supEndNum;
  const contentId =
    kind === "conRus" ? Content.ContractRusData :
    kind === "conNus" ? Content.ContractNusData :
    kind === "supRus" ? Content.SupplyRusData :
    kind === "supNus" ? Content.SupplyNusData :
    Content.SupplyEndData;
  const place =
    kind === "conRus" ? `Внешнеэкономическая сделка > Российские участники > Объект № ${number} > Регистрационные данные` :
    kind === "conNus" ? `Внешнеэкономическая сделка > Иностранные участники > Объект № ${number} > Регистрационные данные` :
    kind === "supRus" ? `Внешнеэкономическая операция > Российские участники > Объект № ${number} > Регистрационные данные` :
    kind === "supNus" ? `Внешнеэкономическая операция > Иностранные покупатели (продавцы) > Объект № ${number} > Регистрационные данные` :
    `Внешнеэкономическая операция > Потребители (конечные пользователи) > Объект № ${number} > Регистрационные данные`;
  if (!text(member.nameLong)) issue(issues, place, "Не указано полное наименование", contentId, member.id);
  if (!text(member.nameShort)) issue(issues, place, "Не указано краткое наименование", contentId, member.id);
  if (kind === "conRus" || kind === "supRus") {
    const inn = member.inn.trim();
    if (!inn) issue(issues, place, "Не указан ИНН", contentId, member.id);
    else if (!/^\d+$/.test(inn) || (inn.length !== 10 && inn.length !== 12)) {
      issue(issues, place, "Указан неверный ИНН", contentId, member.id);
    }
  }
  if (!text(member.addressLegalFull)) issue(issues, place, "Не указан юридический адрес", contentId, member.id);
  if (!text(member.addressLegalCountry)) issue(issues, place, "Не указана страна юридического адреса", contentId, member.id);
  if (kind !== "conRus" && !text(member.addressLegalTown)) {
    issue(issues, place, "Не указан город юридического адреса", contentId, member.id);
  }
}

/** Проверки, которые CheckWork вызывает. Справочник tTnved и пункты перечня не подключены. */
export function checkCustoms(dossier: CustomsDossier, today = new Date()): CheckIssue[] {
  const issues: CheckIssue[] = [];
  if (!text(dossier.description)) {
    issue(issues, "Сведения о работе > Продукция", "Не указано обобщенное наименование объектов экспертизы", Content.Content);
  }
  const usedDocs = dossier.documents.filter((doc) => doc.used);
  if (usedDocs.length === 0) {
    issue(issues, "Сведения о работе > Перечень документов", "Отсутствуют документы, использованные при проведении экспертизы", Content.ExtraDoc);
  } else {
    for (const doc of usedDocs) {
      if (!text(doc.caption)) {
        issue(issues, `Сведения о работе > Перечень документов > Объект № ${doc.rowNum}`, "Не указано наименование или краткое содержание документа", Content.ExtraDoc, doc.id);
      }
    }
    if (!dossier.isDocRule) {
      issue(issues, "Сведения о работе > Перечень документов", "Не подтверждена правоспособность представленных документов", Content.ExtraDoc);
    }
  }
  if (!dossier.isNotContract) {
    if (!text(dossier.contractName)) {
      issue(issues, "Внешнеэкономическая сделка > Регистрационные данные", "Не указано наименование документа-основания сделки", Content.ContractData);
    }
    if (!dossier.contractTerm && !dossier.isNotContractTerm) {
      issue(issues, "Внешнеэкономическая сделка > Регистрационные данные", "Не указан срок действия документа-основания сделки", Content.ContractData);
    }
    if (dossier.contractTerm && parseDate(dossier.contractTerm) < startOfDay(today)) {
      issue(issues, "Внешнеэкономическая сделка > Регистрационные данные", "Срок действия документа-основания сделки меньше текущей даты", Content.ContractData);
    }
    if (!text(dossier.contractDescription)) {
      issue(issues, "Внешнеэкономическая сделка > Регистрационные данные", "Отсутствует описание предмета сделки", Content.ContractData);
    }
    const conRus = dossier.members.filter((member) => member.conRusNum > 0);
    const conNus = dossier.members.filter((member) => member.conNusNum > 0);
    if (conRus.length === 0) issue(issues, "Внешнеэкономическая сделка > Российские участники", "Отсутствуют российские участники сделки", Content.ContractRusList);
    if (conNus.length === 0) issue(issues, "Внешнеэкономическая сделка > Иностранные участники", "Отсутствуют иностранные участники сделки", Content.ContractNusList);
    for (const member of conRus) checkMemberData(issues, member, "conRus");
    for (const member of conNus) checkMemberData(issues, member, "conNus");
  }
  if (!text(dossier.countryName) && dossier.supplyTypeId !== 10) {
    issue(issues, "Внешнеэкономическая операция > Регистрационные данные", "Не указана страна назначения (отправления)", Content.SupplyData);
  }
  if (!text(dossier.supplyDescription)) {
    issue(issues, "Внешнеэкономическая операция > Регистрационные данные", "Отсутствует описание предмета операции", Content.SupplyData);
  }
  const supRus = dossier.members.filter((member) => member.supRusNum > 0);
  if (supRus.length === 0) {
    issue(issues, "Внешнеэкономическая операция > Российские участники", "Отсутствуют российские участники операции", Content.SupplyRusList);
  }
  for (const member of supRus) checkMemberData(issues, member, "supRus");
  for (const member of dossier.members.filter((item) => item.supNusNum > 0)) checkMemberData(issues, member, "supNus");
  for (const member of dossier.members.filter((item) => item.supEndNum > 0)) checkMemberData(issues, member, "supEnd");
  if (dossier.goods.length === 0) issue(issues, "Продукция", "Отсутствуют объекты экспертизы", Content.GoodList);
  for (const good of dossier.goods) {
    const place = `Продукция > Объект № ${good.rowNum} > Регистрационные данные`;
    if (!text(good.nameCon)) issue(issues, place, "Не указано коммерческое наименование", Content.GoodData, good.id);
    if (!text(good.nameDec) && !good.isNotDec) issue(issues, place, "Не указано обозначение", Content.GoodData, good.id);
    if (!text(good.tnved)) issue(issues, place, "Не указан код ТН ВЭД", Content.GoodData, good.id);
    if (!text(good.typeName)) issue(issues, place, "Не указан вид объекта", Content.GoodData, good.id);
    if (!text(good.area)) issue(issues, place, "Не указана область применения", Content.GoodData, good.id);
    if (!text(good.used)) issue(issues, place, "Не указано назначение", Content.GoodData, good.id);
    if (!text(good.description)) issue(issues, place, "Отсутствует техническое описание", Content.GoodData, good.id);
    if (!good.studyDate) {
      issue(issues, `Продукция > Объект № ${good.rowNum} > Единый перечень`, "Отсутствует исследование по Единому перечню", Content.GoodLaw, good.id);
    }
  }
  if (dossier.sections.length === 0) {
    issue(issues, "Решение по анализу", "Не указаны разделы Единого перечня, выбранные для проведения экспертизы", Content.Summary);
  }
  if (!text(dossier.summaryText)) {
    issue(issues, "Решение по анализу", "Отсутствуют выводы экспертизы", Content.Summary);
  }
  return issues;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(value: string): Date {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatRuDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}.${month}.${year}`;
}

export function customsSendBlockers(dossier: CustomsDossier, work: Work, today = new Date()): string[] {
  const blockers: string[] = [];
  if ((work.condition as string) === "query") {
    blockers.push("Работы в состоянии \"Запрос\" на утверждение не отправляются.");
  }
  if (checkCustoms(dossier, today).length > 0) blockers.push("В работе обнаружены ошибки.");
  if (!text(dossier.project1)) {
    blockers.push("В работе отсутствует проект заключения. Создайте проект заключения.");
  }
  if (dossier.projectsStale) {
    blockers.push("Данные работы были изменены после создания проектов заключений.\nСоздайте новые проекты заключений.");
  }
  return blockers;
}

export function customsSendWarnings(dossier: CustomsDossier, today = new Date()): string[] {
  if (dossier.isNotContract || !dossier.contractDate) return [];
  const contractDate = parseDate(dossier.contractDate);
  const oldest = new Date(today.getTime());
  oldest.setFullYear(oldest.getFullYear() - 50);
  if (contractDate > today || contractDate < oldest) {
    return [`Дата документа-основания сделки: ${formatRuDate(dossier.contractDate)}.\nВы действительно хотите отправить работу на утверждение?`];
  }
  return [];
}

function blankMember(id: number, partial: Partial<CustomsMember>): CustomsMember {
  return {
    id,
    nameLong: "",
    nameShort: "",
    inn: "",
    addressLegalFull: "",
    addressLegalCountry: "",
    addressLegalTown: "",
    conRusNum: 0,
    conNusNum: 0,
    supRusNum: 0,
    supNusNum: 0,
    supEndNum: 0,
    ...partial,
  };
}

function completeDossier(workId: number, description: string): CustomsDossier {
  return {
    workId,
    description,
    matCount: 1,
    infCount: 0,
    addWorkCount: 0,
    langCount: 0,
    urgencyId: 1,
    complexity: "",
    isSendQuery: false,
    isMakeProfile: false,
    planeComment: "",
    isNotContract: false,
    contractName: "Контракт",
    contractNum: "ЗИО-19/26",
    contractDate: "2026-02-02",
    contractTerm: "2027-02-02",
    isNotContractTerm: false,
    contractDescription: "Поставка шестеренного насоса для промышленной гидросистемы",
    isNotContractRisk: true,
    supplyTypeId: 1,
    invoiceCaption: "Инвойс INV-19",
    countryName: "Казахстан",
    supplyDescription: "Вывоз насоса в Республику Казахстан",
    incoterms: "CPT",
    incotermsPlace: "Астана",
    isNotSupplyRisk: true,
    members: [
      blankMember(1, {
        nameLong: "ООО «Ладогамаш»",
        nameShort: "Ладогамаш",
        inn: "7812345678",
        addressLegalFull: "195027, Санкт-Петербург, пр. Примерный, 8",
        addressLegalCountry: "Россия",
        addressLegalTown: "Санкт-Петербург",
        conRusNum: 1,
        supRusNum: 1,
      }),
      blankMember(2, {
        nameLong: "Astana Hydro LLP",
        nameShort: "Astana Hydro",
        addressLegalFull: "проспект Мангилик Ел, 10, Астана",
        addressLegalCountry: "Казахстан",
        addressLegalTown: "Астана",
        conNusNum: 1,
        supNusNum: 1,
        supEndNum: 1,
      }),
    ],
    goods: [
      {
        id: 1,
        rowNum: 1,
        nameCon: "Насос шестеренный",
        nameDec: "НШ-32",
        isNotDec: false,
        tnved: "8413608000",
        cas: "",
        tnvedComment: "Насос объёмный роторный",
        typeName: "Готовое изделие",
        area: "Гидравлика промышленного оборудования",
        used: "Подача рабочей жидкости",
        description: "Шестеренный насос, рабочий объём 32 см3.",
        studyDate: "2026-09-18",
      },
    ],
    sections: [
      { id: 1, pos: "2.12", description: "Насосы объёмные роторные" },
    ],
    summaryText: "Товар не включен в Единый перечень товаров, к которым применяются запреты или ограничения.",
    isDocRule: true,
    documents: [{ id: 1, rowNum: 1, caption: "Контракт ЗИО-19/26 и инвойс", regNum: "ЗИО-19/26", regDate: "2026-02-02", used: true }],
    project1: "Проект заключения по шестеренному насосу.",
    comments: { p2: "", p3: "", p4: "", p5: "", p6: "" },
    projectsStale: false,
    requests: [],
  };
}

export function createCustomsDossiers(): Record<number, CustomsDossier> {
  return {
    18610: completeDossier(18610, "Насос шестеренный для гидросистемы"),
    18390: completeDossier(18390, "Клапан регулирующий, партия"),
  };
}

export function cloneCustoms(dossier: CustomsDossier): CustomsDossier {
  return structuredClone(dossier);
}
