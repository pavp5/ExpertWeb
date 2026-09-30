import assert from "node:assert/strict";
import { test } from "node:test";
import { createSeedWorks } from "./seed.ts";
import { buildTnvedTree, checkTnved, cloneTnved, createTnvedDossiers, tnvedSendBlockers } from "./tnved.ts";

const today = new Date("2026-09-30T12:00:00");

test("дерево кода ТН ВЭД содержит только план и продукцию", () => {
  const tree = buildTnvedTree(createTnvedDossiers()[18455]);
  assert.deepEqual(
    tree.filter((node) => node.parentId == null).map((node) => node.caption),
    ["ПЛАН РАБОТЫ", "ПРОДУКЦИЯ (ОБЪЕКТЫ ЭКСПЕРТИЗЫ)"],
  );
  assert.equal(tree.some((node) => node.caption === "1. Плата управления"), true);
  assert.equal(tree.some((node) => node.caption.includes("СДЕЛКА")), false);
  assert.equal(tree.some((node) => node.caption.includes("РЕШЕНИЕ")), false);
});

test("заполненная карточка кода проходит проверку и отправку", () => {
  const ready = createTnvedDossiers()[18455];
  const work = createSeedWorks(today).find((item) => item.id === 18455);
  assert.ok(work);
  assert.equal(work.type, "tnved");
  assert.equal(work.goodCount, 3);
  assert.deepEqual(checkTnved(ready), []);
  assert.deepEqual(tnvedSendBlockers(ready, work), []);
});

test("пустая карточка кода сообщает про документы, объект и проект", () => {
  const thin = cloneTnved(createTnvedDossiers()[18455]);
  thin.description = "";
  thin.documents = [];
  thin.project1 = "";
  thin.goods = [
    {
      id: 7,
      rowNum: 1,
      nameCon: "",
      nameDec: "",
      isNotDec: false,
      typeId: null,
      tnved: "8537109100",
      cas: "",
      tnvedComment: "",
      area: "",
      used: "",
      description: "",
    },
  ];
  const messages = checkTnved(thin).map((item) => item.description);
  assert.equal(messages.includes("Не указано обобщенное наименование объектов экспертизы"), true);
  assert.equal(messages.includes("Отсутствуют документы, использованные при проведении экспертизы"), true);
  assert.equal(messages.includes("Не указано коммерческое наименование"), true);
  assert.equal(messages.includes("Не указано обозначение"), true);
  assert.equal(messages.includes("Отсутствует обоснование кода ТН ВЭД"), true);
  assert.equal(messages.includes("Не указан вид объекта"), true);
  assert.equal(messages.includes("Не указана область применения"), true);
  assert.equal(messages.includes("Не указано назначение"), true);
  assert.equal(messages.includes("Отсутствует техническое описание"), true);
  assert.equal(messages.includes("Код ТН ВЭД отсутствует в актуальной редакции товарной номенклатуры"), false);
  const work = createSeedWorks(today).find((item) => item.id === 18455);
  assert.ok(work);
  assert.equal(
    tnvedSendBlockers(thin, work).includes("В работе отсутствует проект заключения. Создайте проект заключения."),
    true,
  );
});

test("общая область применения закрывает пустое поле объекта", () => {
  const dossier = cloneTnved(createTnvedDossiers()[18455]);
  dossier.goods[0].area = "";
  dossier.goods[0].used = "";
  dossier.goodArea = "Промышленное оборудование";
  dossier.goodUsed = "Комплектация привода";
  assert.equal(checkTnved(dossier).some((item) => item.description === "Не указана область применения"), false);
  assert.equal(checkTnved(dossier).some((item) => item.description === "Не указано назначение"), false);
});
