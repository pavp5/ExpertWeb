import assert from "node:assert/strict";
import { test } from "node:test";
import { cloneCustoms, checkCustoms, createCustomsDossiers, customsSendBlockers, customsSendWarnings, buildCustomsTree } from "./customs.ts";
import { createSeedWorks } from "./seed.ts";

const today = new Date("2026-09-30T12:00:00");

test("дерево ЗиО не содержит дополнительную информацию и показывает сделку", () => {
  const tree = buildCustomsTree(createCustomsDossiers()[18610]);
  assert.deepEqual(
    tree.filter((node) => node.parentId == null).map((node) => node.caption),
    [
      "ПЛАН РАБОТЫ",
      "ВНЕШНЕЭКОНОМИЧЕСКАЯ СДЕЛКА",
      "ВНЕШНЕЭКОНОМИЧЕСКАЯ ОПЕРАЦИЯ",
      "ПРОДУКЦИЯ (ОБЪЕКТЫ ЭКСПЕРТИЗЫ)",
      "РЕШЕНИЕ ПО АНАЛИЗУ",
    ],
  );
  assert.equal(tree.some((node) => node.caption === "1. Насос шестеренный"), true);
});

test("заполненная карточка ЗиО проходит проверку и отправку", () => {
  const ready = createCustomsDossiers()[18610];
  const work = createSeedWorks(today).find((item) => item.id === 18610);
  assert.ok(work);
  assert.deepEqual(checkCustoms(ready, today), []);
  assert.deepEqual(customsSendBlockers(ready, work, today), []);
  assert.deepEqual(customsSendWarnings(ready, today), []);
});

test("пустая карточка ЗиО сообщает про перечень, участников и выводы", () => {
  const thin = cloneCustoms(createCustomsDossiers()[18610]);
  thin.members = [];
  thin.contractName = "";
  thin.goods = [];
  thin.sections = [];
  thin.summaryText = "";
  thin.documents = [];
  thin.project1 = "";
  const issues = checkCustoms(thin, today);
  assert.equal(issues.some((issue) => issue.description === "Не указано наименование документа-основания сделки"), true);
  assert.equal(issues.some((issue) => issue.description === "Отсутствуют российские участники сделки"), true);
  assert.equal(issues.some((issue) => issue.description === "Отсутствуют объекты экспертизы"), true);
  assert.equal(issues.some((issue) => issue.description === "Не указаны разделы Единого перечня, выбранные для проведения экспертизы"), true);
  assert.equal(issues.some((issue) => issue.description === "Отсутствуют выводы экспертизы"), true);
  const work = createSeedWorks(today).find((item) => item.id === 18610);
  assert.ok(work);
  assert.equal(
    customsSendBlockers(thin, work, today).includes("В работе отсутствует проект заключения. Создайте проект заключения."),
    true,
  );
});
