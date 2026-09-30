import assert from "node:assert/strict";
import { test } from "node:test";
import { createSeedWorks } from "./seed.ts";
import {
  buildMilitaryTree,
  checkMilitary,
  cloneMilitary,
  createMilitaryDossiers,
  militarySendBlockers,
} from "./military.ts";

const today = new Date("2026-09-30T12:00:00");

test("дерево гражданской продукции содержит участника, продукцию и решение", () => {
  const tree = buildMilitaryTree(createMilitaryDossiers()[18540]);
  assert.deepEqual(
    tree.filter((node) => node.parentId == null).map((node) => node.caption),
    ["ПЛАН РАБОТЫ", "РОССИЙСКИЙ УЧАСТНИК", "ПРОДУКЦИЯ (ОБЪЕКТЫ ЭКСПЕРТИЗЫ)", "РЕШЕНИЕ ПО АНАЛИЗУ"],
  );
  assert.equal(tree.some((node) => node.caption === "1. Блок питания промышленный"), true);
  assert.equal(tree.some((node) => node.caption === "2. Модуль индикации"), true);
  assert.equal(tree.some((node) => node.caption.includes("СДЕЛКА")), false);
  assert.equal(tree.some((node) => node.caption.includes("ЛИЦЕНЗ")), false);
});

test("заполненная карточка гражданской продукции проходит проверку и отправку", () => {
  const ready = createMilitaryDossiers()[18540];
  const work = createSeedWorks(today).find((item) => item.id === 18540);
  assert.ok(work);
  assert.equal(work.type, "military");
  assert.equal(work.isAskSend, true);
  assert.equal(work.goodCount, 2);
  assert.equal(work.totalWork, 60);
  assert.equal(ready.changeSourceId === 4, false);
  assert.deepEqual(checkMilitary(ready), []);
  assert.deepEqual(militarySendBlockers(ready, work), []);
});

test("пустая карточка гражданской продукции сообщает про участника, документы и решение", () => {
  const thin = cloneMilitary(createMilitaryDossiers()[18540]);
  thin.description = "";
  thin.member = null;
  thin.documents = [];
  thin.goods = [{
    ...thin.goods[0],
    nameCon: "",
    nameDec: "",
    isNotDec: false,
    tnved: "-",
    typeId: null,
    area: "",
    used: "",
    description: "",
    summary: "",
    civilDocs: [],
  }];
  thin.goodArea = "";
  thin.goodUsed = "";
  thin.summary = "";
  thin.comment = "";
  thin.project1 = "";
  const messages = checkMilitary(thin).map((item) => item.description);
  assert.equal(messages.includes("Не указано обобщенное наименование объектов экспертизы"), true);
  assert.equal(messages.includes("Отсутствует российский участник внешнеэкономической операции"), true);
  assert.equal(messages.includes("Отсутствуют документы, использованные при проведении экспертизы"), true);
  assert.equal(messages.includes("Не указано коммерческое наименование"), true);
  assert.equal(messages.includes("Отсутствуют документы, подтверждающие гражданское назначение"), true);
  assert.equal(messages.includes("Отсутствуют выводы экспертизы"), true);
  assert.equal(messages.includes("Отсутствуют пояснения эксперта"), true);
  assert.equal(messages.includes("Код ТН ВЭД отсутствует в актуальной редакции товарной номенклатуры"), false);
  const work = createSeedWorks(today).find((item) => item.id === 18540);
  assert.ok(work);
  assert.equal(
    militarySendBlockers(thin, work).includes("В работе отсутствует проект заключения. Создайте проект заключения."),
    true,
  );
});
