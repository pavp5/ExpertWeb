/** Карточка ДН: Cprp.DxData.Work.Excont, разделы ContentEnum и проверки ErrorDataTable. */

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
  Summary: 110,
  ExtraInfo: 120,
  ExtraDoc: 130,
  Project: 140,
  Request: 150,
  Internal: 160,
} as const;

export const SUPPLY_TYPES: { id: number; label: string }[] = [
  { id: 1, label: "Экспорт товаров из Российской Федерации" },
  { id: 2, label: "Импорт товаров в Российскую Федерацию" },
  { id: 3, label: "Временный вывоз товаров из Российской Федерации" },
  { id: 4, label: "Ввоз товаров в Российскую Федерацию, ранее поставлявшихся в режиме временного вывоза" },
  { id: 5, label: "Временный ввоз товаров в Российскую Федерацию" },
  { id: 6, label: "Вывоз товаров из Российской Федерации, ранее поставлявшихся в режиме временного ввоза" },
  { id: 7, label: "Вывоз товаров из Российской Федерации с целью ремонта или замены на аналогичные" },
  { id: 8, label: "Ввоз товаров в Российскую Федерацию с целью ремонта или замены на аналогичные" },
  { id: 9, label: "Вывоз товаров из Российской Федерации на борт российского морского или воздушного судна" },
  { id: 10, label: "Транзит в Калининградскую область" },
  { id: 13, label: "Вывоз товара из Российской Федерации" },
  { id: 14, label: "Ввоз товара из Российской Федерации" },
  { id: 15, label: "Передача иностранному лицу на территории Российской Федерации" },
  { id: 16, label: "Внешнеэкономическая операция отсутствует" },
];

export const SUMMARY_OPTIONS: { id: number; label: string }[] = [
  { id: 1, label: "Не требуется оформление разрешительных документов" },
  { id: 2, label: "Необходимо получение лицензии ФСТЭК России" },
  { id: 3, label: "Необходимо получение разрешения КЭК" },
  { id: 4, label: "Распространяется действие специальных экономических мер" },
  { id: 5, label: "Объекты экспертизы соответствуют контрольным спискам, но получение лицензии не требуется" },
  { id: 6, label: "Необходимо обратиться в ФСТЭК" },
];

export const WORK_KINDS: { id: number; label: string }[] = [
  { id: 1, label: "Первичная" },
  { id: 2, label: "Повторная" },
  { id: 3, label: "Дополнительная" },
];

/** StudyIndexEnum.IsEqual */
export const STUDY_EQUAL = 2;

export interface ExcontMember {
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
  isNotEmbargo: boolean;
  proDescription: string;
  proSource: string;
  isNotRisk: boolean;
}

export interface ExcontGood {
  id: number;
  rowNum: number;
  parentId: number | null;
  nameCon: string;
  nameDec: string;
  isNotDec: boolean;
  tnved: string;
  typeName: string;
  area: string;
  used: string;
  description: string;
  isUnreal: boolean;
  studyDate: string;
  studySummaryId: number;
  isNotEmbargo: boolean;
  isNotRisk: boolean;
}

export interface ExcontDocument {
  id: number;
  rowNum: number;
  caption: string;
  used: boolean;
}

export interface ExcontNote {
  id: number;
  caption: string;
  text: string;
}

export interface ExcontDossier {
  workId: number;
  description: string;
  isNotContract: boolean;
  contractName: string;
  contractNum: string;
  contractDate: string;
  contractTerm: string;
  isNotContractTerm: boolean;
  contractDescription: string;
  isNotContractRisk: boolean;
  supplyTypeId: number | null;
  countryName: string;
  bankCountry: string;
  supplyDescription: string;
  incoterms: string;
  isNotSupplyRisk: boolean;
  members: ExcontMember[];
  goods: ExcontGood[];
  summaryId: number | null;
  summaryText: string;
  summaryRisk: string;
  kindId: number;
  kindComment: string;
  docTerm: string;
  extraComment: string;
  isDocRule: boolean;
  documents: ExcontDocument[];
  project1: string;
  project2: string;
  projectsStale: boolean;
  requests: ExcontNote[];
  internals: ExcontNote[];
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

function memberLabel(member: ExcontMember): string {
  return member.nameLong.trim() || "[нет наименования]";
}

/** Дерево содержания, WorkContentDataTable.DataReload. Состояние «новая» и план сюда не входят. */
export function buildContentTree(dossier: ExcontDossier): ContentNode[] {
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
    const parent = good.parentId == null ? Content.GoodList : good.parentId;
    const name = good.nameCon.trim() || "[нет наименования]";
    add(good.id, parent, Content.GoodData, good.id, `${good.rowNum}. ${name}`);
  }
  add(Content.Summary, null, Content.Summary, 0, "РЕШЕНИЕ ПО АНАЛИЗУ");
  add(Content.ExtraInfo, null, Content.ExtraInfo, 0, "ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ");
  return nodes;
}

function issue(issues: CheckIssue[], place: string, description: string, contentId: number, objectId = 0) {
  issues.push({ place, description, contentId, objectId });
}

function checkMemberData(issues: CheckIssue[], member: ExcontMember, kind: "conRus" | "conNus" | "supRus" | "supNus" | "supEnd") {
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

function profileRequired(dossier: ExcontDossier): boolean {
  return dossier.goods.some((good) => good.studySummaryId > 0);
}

function checkProfile(issues: CheckIssue[], member: ExcontMember, place: string, contentId: number) {
  // В CheckMemberProfile сообщения привязаны к полям наоборот: пустой proSource — «профиль», пустой proDescription — «источник».
  if (!text(member.proSource)) issue(issues, place, "Не заполнен профиль фирмы", contentId, member.id);
  if (!text(member.proDescription)) issue(issues, place, "Не указан источник данных для заполнения профиля", contentId, member.id);
}

/** Проверки ErrorDataTable, которые читают поля карточки. Справочники tTnved и эмбарго не подключены. */
export function checkExcont(dossier: ExcontDossier, today = new Date()): CheckIssue[] {
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
    if (!dossier.isNotContractRisk) {
      issue(issues, "Внешнеэкономическая сделка > Риски", "Не указано наличие или отсутствие рисков", Content.ContractRisk);
    }
    const conRus = dossier.members.filter((member) => member.conRusNum > 0);
    const conNus = dossier.members.filter((member) => member.conNusNum > 0);
    if (conRus.length === 0) issue(issues, "Внешнеэкономическая сделка > Российские участники", "Отсутствуют российские участники сделки", Content.ContractRusList);
    if (conNus.length === 0) issue(issues, "Внешнеэкономическая сделка > Иностранные участники", "Отсутствуют иностранные участники сделки", Content.ContractNusList);
    for (const member of conRus) {
      checkMemberData(issues, member, "conRus");
      if (!member.isNotRisk) {
        issue(issues, `Внешнеэкономическая сделка > Российские участники > Объект № ${member.conRusNum} > Риски`, "Не указано наличие или отсутствие рисков", Content.ContractRusData, member.id);
      }
    }
    for (const member of conNus) {
      checkMemberData(issues, member, "conNus");
      if (!member.isNotEmbargo) {
        issue(issues, `Внешнеэкономическая сделка > Иностранные участники > Объект № ${member.conNusNum} > Запреты и ограничения`, "Не указано наличие или отсутствие запретов и ограничений", Content.ContractNusData, member.id);
      }
      if (profileRequired(dossier)) {
        checkProfile(issues, member, `Внешнеэкономическая сделка > Иностранные участники > Объект № ${member.conNusNum} > Профиль`, Content.ContractNusData);
      }
      if (!member.isNotRisk) {
        issue(issues, `Внешнеэкономическая сделка > Иностранные участники > Объект № ${member.conNusNum} > Риски`, "Не указано наличие или отсутствие рисков", Content.ContractNusData, member.id);
      }
    }
  }
  if (dossier.supplyTypeId == null) {
    issue(issues, "Внешнеэкономическая операция > Регистрационные данные", "Не указан характер внешнеэкономической операции", Content.SupplyData);
  }
  if (!text(dossier.countryName) && dossier.supplyTypeId !== 10) {
    issue(issues, "Внешнеэкономическая операция > Регистрационные данные", "Не указана страна назначения (отправления)", Content.SupplyData);
  }
  if (!text(dossier.bankCountry)) {
    issue(issues, "Внешнеэкономическая операция > Регистрационные данные", "Не указана страна банка", Content.SupplyData);
  }
  if (!text(dossier.supplyDescription)) {
    issue(issues, "Внешнеэкономическая операция > Регистрационные данные", "Отсутствует описание предмета операции", Content.SupplyData);
  }
  if (!dossier.isNotSupplyRisk) {
    issue(issues, "Внешнеэкономическая операция > Риски", "Не указано наличие или отсутствие рисков", Content.SupplyRisk);
  }
  const lists: { kind: "supRus" | "supNus" | "supEnd"; place: string; empty: string; contentId: number }[] = [
    { kind: "supRus", place: "Внешнеэкономическая операция > Российские участники", empty: "Отсутствуют российские участники операции", contentId: Content.SupplyRusList },
    { kind: "supNus", place: "Внешнеэкономическая операция > Иностранные покупатели (продавцы)", empty: "Отсутствуют иностранные покупатели (продлавцы)", contentId: Content.SupplyNusList },
    { kind: "supEnd", place: "Внешнеэкономическая операция > Потребители (конечные пользователи)", empty: "Отсутствуют потребители (конечные пользователи)", contentId: Content.SupplyEndList },
  ];
  for (const list of lists) {
    const rows = dossier.members.filter((member) => member[`${list.kind}Num`] > 0);
    // CheckSupply вызывает CheckMemberList только для российских участников операции.
    if (list.kind === "supRus" && rows.length === 0) issue(issues, list.place, list.empty, list.contentId);
    for (const member of rows) {
      checkMemberData(issues, member, list.kind);
      if (list.kind === "supRus") {
        if (!member.isNotRisk) {
          issue(issues, `${list.place} > Объект № ${member[`${list.kind}Num`]} > Риски`, "Не указано наличие или отсутствие рисков", list.contentId, member.id);
        }
      } else {
        if (!member.isNotEmbargo) {
          issue(issues, `${list.place} > Объект № ${member[`${list.kind}Num`]} > Запреты и ограничения`, "Не указано наличие или отсутствие запретов и ограничений", list.contentId, member.id);
        }
        if (profileRequired(dossier)) {
          checkProfile(issues, member, `${list.place} > Объект № ${member[`${list.kind}Num`]} > Профиль`, list.contentId);
        }
        if (!member.isNotRisk) {
          issue(issues, `${list.place} > Объект № ${member[`${list.kind}Num`]} > Риски`, "Не указано наличие или отсутствие рисков", list.contentId, member.id);
        }
      }
    }
  }
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
      issue(issues, `Продукция > Объект № ${good.rowNum} > Контрольные списки`, "Отсутствует исследование по контрольным спискам", Content.GoodData, good.id);
    }
    if (!good.isNotEmbargo) {
      issue(issues, `Продукция > Объект № ${good.rowNum} > Запреты и ограничения`, "Не указано наличие или отсутствие запретов и ограничений", Content.GoodData, good.id);
    }
    if (!good.isNotRisk) {
      issue(issues, `Продукция > Объект № ${good.rowNum} > Риски`, "Не указано наличие или отсутствие рисков", Content.GoodData, good.id);
    }
  }
  if (!text(dossier.summaryText)) {
    issue(issues, "Решение по анализу", "Отсутствуют выводы экспертизы", Content.Summary);
  } else if (dossier.summaryId === 3 && !text(dossier.summaryRisk)) {
    issue(issues, "Решение по анализу", "Отсутствует анализ выявленных рисков", Content.Summary);
  }
  const hasEqual = dossier.goods.some((good) => !good.isUnreal && good.studySummaryId === STUDY_EQUAL);
  const hasEmbargo = dossier.members.some((member) => !member.isNotEmbargo) || dossier.goods.some((good) => !good.isNotEmbargo);
  if (text(dossier.summaryText) && dossier.summaryId != null) {
    if ((dossier.summaryId === 1 && (hasEqual || hasEmbargo)) ||
        (dossier.summaryId === 2 && (!hasEqual || hasEmbargo)) ||
        (dossier.summaryId === 4 && !hasEmbargo) ||
        (dossier.summaryId === 5 && (!hasEqual || hasEmbargo))) {
      issue(issues, "Решение по анализу", "Выводы экспертизы не соответствуют контрольному статусу объектов экспертизы", Content.Summary);
    }
  }
  if (dossier.kindId !== 1 && !text(dossier.kindComment)) {
    issue(issues, "Дополнительная информация", "Отсутствует комментарий к характеристике экспертизы", Content.ExtraInfo);
  }
  if (dossier.docTerm) {
    const term = parseDate(dossier.docTerm);
    const tomorrow = startOfDay(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (term < tomorrow) issue(issues, "Дополнительная информация", "Некорректный срок действия заключения экспертизы", Content.ExtraInfo);
  } else if (dossier.goods.some((good) => good.studySummaryId !== STUDY_EQUAL)) {
    issue(issues, "Дополнительная информация", "Необходимо указать срок действия заключения экспертизы", Content.ExtraInfo);
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

/** Вопросы ExpertWorkSend после формальной проверки. Пустой справочник ФСТЭК сюда не входит. */
export function sendWarnings(dossier: ExcontDossier, today = new Date()): string[] {
  const warnings: string[] = [];
  if (!dossier.isNotContract && dossier.contractDate) {
    const contractDate = parseDate(dossier.contractDate);
    const oldest = new Date(today.getTime());
    oldest.setFullYear(oldest.getFullYear() - 50);
    if (contractDate > today || contractDate < oldest) {
      warnings.push(`Дата документа-основания сделки: ${formatRuDate(dossier.contractDate)}.\nВы действительно хотите отправить работу на утверждение?`);
    }
  }
  if (!dossier.members.some((member) => member.supNusNum > 0)) {
    warnings.push("Отсутствует иностранный покупатель (продавец).\nВы действительно хотите отправить работу на утверждение?");
  }
  if (dossier.docTerm) {
    const limit = startOfDay(today);
    limit.setMonth(limit.getMonth() + 3);
    if (parseDate(dossier.docTerm) < limit) {
      warnings.push(`Срок действия заключения экспертизы: ${formatRuDate(dossier.docTerm)}.\nВы действительно хотите отправить работу на утверждение?`);
    }
  }
  return warnings;
}

export function projectSlots(dossier: ExcontDossier): number {
  const real = dossier.goods.filter((good) => !good.isUnreal);
  let slots = 0;
  if (real.some((good) => good.studySummaryId !== STUDY_EQUAL)) slots += 1;
  if (real.some((good) => good.studySummaryId === STUDY_EQUAL)) slots += 1;
  return slots;
}

export function projectCount(dossier: ExcontDossier): number {
  return (text(dossier.project1) ? 1 : 0) + (text(dossier.project2) ? 1 : 0);
}

function blankMember(id: number, partial: Partial<ExcontMember>): ExcontMember {
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
    isNotEmbargo: true,
    proDescription: "",
    proSource: "",
    isNotRisk: true,
    ...partial,
  };
}

function completeDossier(workId: number, description: string): ExcontDossier {
  return {
    workId,
    description,
    isNotContract: false,
    contractName: "Контракт",
    contractNum: "Д-14/26",
    contractDate: "2026-03-12",
    contractTerm: "2027-03-12",
    isNotContractTerm: false,
    contractDescription: "Поставка промышленного оптического модуля и кабелей",
    isNotContractRisk: true,
    supplyTypeId: 1,
    countryName: "Германия",
    bankCountry: "Германия",
    supplyDescription: "Экспорт оптического модуля для промышленной линии",
    incoterms: "CIP Гамбург",
    isNotSupplyRisk: true,
    members: [
      blankMember(1, {
        nameLong: "ООО «Нева-Инструмент»",
        nameShort: "Нева-Инструмент",
        inn: "7801234567",
        addressLegalFull: "197101, Санкт-Петербург, ул. Примерная, 1",
        addressLegalCountry: "Россия",
        addressLegalTown: "Санкт-Петербург",
        conRusNum: 1,
        supRusNum: 1,
      }),
      blankMember(2, {
        nameLong: "Nordoptik GmbH",
        nameShort: "Nordoptik",
        addressLegalFull: "Hafenstrasse 4, Hamburg",
        addressLegalCountry: "Германия",
        addressLegalTown: "Гамбург",
        conNusNum: 1,
        supNusNum: 1,
        supEndNum: 1,
        proDescription: "Производитель оптических узлов, открытые реестры.",
        proSource: "Выписка реестра и сайт изготовителя",
      }),
    ],
    goods: [
      {
        id: 1,
        rowNum: 1,
        parentId: null,
        nameCon: "Оптический модуль",
        nameDec: "OM-200",
        isNotDec: false,
        tnved: "9013800000",
        typeName: "Готовое изделие",
        area: "Промышленная автоматика",
        used: "Передача сигнала в составе линии",
        description: "Модуль с оптическим разъёмом, питание 24 В.",
        isUnreal: false,
        studyDate: "2026-09-20",
        studySummaryId: STUDY_EQUAL,
        isNotEmbargo: true,
        isNotRisk: true,
      },
    ],
    summaryId: 2,
    summaryText: "Для осуществления внешнеэкономической операции требуется лицензия Федеральной службы по техническому и экспортному контролю.",
    summaryRisk: "",
    kindId: 1,
    kindComment: "",
    docTerm: "2027-09-30",
    extraComment: "",
    isDocRule: true,
    documents: [{ id: 1, rowNum: 1, caption: "Контракт Д-14/26 и спецификация", used: true }],
    project1: "Проект заключения по контролируемому оптическому модулю.",
    project2: "",
    projectsStale: false,
    requests: [],
    internals: [],
  };
}

export function createExcontDossiers(): Record<number, ExcontDossier> {
  const incomplete = completeDossier(18510, "Редуктор промышленный");
  incomplete.members = [];
  incomplete.contractName = "";
  incomplete.goods = [];
  incomplete.summaryText = "";
  incomplete.documents = [];
  incomplete.project1 = "";
  return {
    18580: completeDossier(18580, "Оптический модуль и кабели"),
    18420: completeDossier(18420, "Насос центробежный, комплект уплотнений"),
    18510: incomplete,
  };
}

export function cloneDossier(dossier: ExcontDossier): ExcontDossier {
  return structuredClone(dossier);
}
