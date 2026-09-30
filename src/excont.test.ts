import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildContentTree,
  checkExcont,
  cloneDossier,
  Content,
  createExcontDossiers,
  projectCount,
  projectSlots,
  sendWarnings,
} from "./excont.ts";

const today = new Date("2026-09-30T12:00:00");

test("дерево содержания ДН собирает сделку, операцию, продукцию и решение", () => {
  const dossier = createExcontDossiers()[18580];
  const tree = buildContentTree(dossier);
  assert.deepEqual(
    tree.filter((node) => node.parentId == null).map((node) => node.caption),
    [
      "ПЛАН РАБОТЫ",
      "ВНЕШНЕЭКОНОМИЧЕСКАЯ СДЕЛКА",
      "ВНЕШНЕЭКОНОМИЧЕСКАЯ ОПЕРАЦИЯ",
      "ПРОДУКЦИЯ (ОБЪЕКТЫ ЭКСПЕРТИЗЫ)",
      "РЕШЕНИЕ ПО АНАЛИЗУ",
      "ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ",
    ],
  );
  assert.equal(tree.some((node) => node.caption.startsWith("1. ООО")), true);
  assert.equal(tree.some((node) => node.caption === "1. Оптический модуль"), true);
  assert.equal(tree.find((node) => node.caption === "1. Оптический модуль")?.contentId, Content.GoodData);
});

test("заполненная карточка ДН проходит проверку, пустые участники — нет", () => {
  const ready = createExcontDossiers()[18580];
  assert.deepEqual(checkExcont(ready, today), []);
  assert.equal(projectSlots(ready), 1);
  assert.equal(projectCount(ready), 1);

  const thin = createExcontDossiers()[18510];
  const issues = checkExcont(thin, today);
  assert.equal(issues.some((issue) => issue.description === "Не указано наименование документа-основания сделки"), true);
  assert.equal(issues.some((issue) => issue.description === "Отсутствуют российские участники сделки"), true);
  assert.equal(issues.some((issue) => issue.description === "Отсутствуют объекты экспертизы"), true);
  assert.equal(issues.some((issue) => issue.description === "Отсутствуют выводы экспертизы"), true);
});

test("отправка заполненной карточки не задаёт дополнительных вопросов", () => {
  const ready = createExcontDossiers()[18580];
  assert.deepEqual(sendWarnings(ready, today), []);
  ready.isDocRule = false;
  const issues = checkExcont(ready, today);
  assert.equal(issues.some((issue) => issue.description === "Не подтверждена правоспособность представленных документов"), true);
});

test("без иностранного покупателя отправка спрашивает подтверждение", () => {
  const dossier = cloneDossier(createExcontDossiers()[18580]);
  for (const member of dossier.members) member.supNusNum = 0;
  assert.equal(
    sendWarnings(dossier, today)[0],
    "Отсутствует иностранный покупатель (продавец).\nВы действительно хотите отправить работу на утверждение?",
  );
});

test("вывод «лицензия» не сходится, если объект не соответствует спискам", () => {
  const dossier = cloneDossier(createExcontDossiers()[18580]);
  dossier.goods[0].studySummaryId = 0;
  dossier.docTerm = "2027-09-30";
  const issues = checkExcont(dossier, today);
  assert.equal(
    issues.some((issue) => issue.description === "Выводы экспертизы не соответствуют контрольному статусу объектов экспертизы"),
    true,
  );
});
