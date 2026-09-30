import assert from "node:assert/strict";
import { test } from "node:test";
import { createSeedWorks } from "./seed.ts";
import { buildLiconfirmTree, checkLiconfirm, cloneLiconfirm, createLiconfirmDossiers, liconfirmSendBlockers } from "./liconfirm.ts";

const today = new Date("2026-09-30T12:00:00");

test("дерево подтверждения содержит план, лицензию, продукцию и доп. информацию", () => {
  const tree = buildLiconfirmTree(createLiconfirmDossiers()[18502]);
  assert.deepEqual(
    tree.filter((node) => node.parentId == null).map((node) => node.caption),
    ["ПЛАН РАБОТЫ", "СВЕДЕНИЯ О ЛИЦЕНЗИИ", "ПРОДУКЦИЯ (ОБЪЕКТЫ ЭКСПЕРТИЗЫ)", "ДОПОЛНИТЕЛЬНАЯ ИНФОРМАЦИЯ"],
  );
  assert.equal(tree.some((node) => node.caption === "1. Модуль управления"), true);
});

test("заполненная карточка подтверждения проходит проверку и отправку", () => {
  const ready = createLiconfirmDossiers()[18502];
  const work = createSeedWorks(today).find((item) => item.id === 18502);
  assert.ok(work);
  assert.equal(work.type, "liconfirm");
  assert.equal(work.goodCount, 1);
  assert.equal(work.totalWork, 40);
  assert.equal(work.isAskSign, true);
  assert.deepEqual(checkLiconfirm(ready), []);
  assert.deepEqual(liconfirmSendBlockers(ready, work), []);
});

test("без лицензии проверка останавливается и не смотрит объекты", () => {
  const thin = cloneLiconfirm(createLiconfirmDossiers()[18502]);
  thin.licId = null;
  thin.goods = [];
  thin.documents = [];
  const messages = checkLiconfirm(thin).map((item) => item.description);
  assert.equal(messages.includes("Не выбрана лицензия"), true);
  assert.equal(messages.includes("Отсутствуют документы, использованные при проведении экспертизы"), true);
  assert.equal(messages.includes("Отсутствуют объекты экспертизы"), false);
});

test("выбранная лицензия требует пункты приложения и не требует обоснование кода", () => {
  const thin = cloneLiconfirm(createLiconfirmDossiers()[18502]);
  thin.goods[0].appendIds = [];
  thin.goods[0].goodDescription = "";
  thin.goods[0].tnvedComment = "";
  thin.project1 = "";
  const messages = checkLiconfirm(thin).map((item) => item.description);
  assert.equal(messages.includes("Не выбраны пункты приложения к лицензии"), true);
  assert.equal(messages.includes("Отсутствует обоснование кода ТН ВЭД"), false);
  assert.equal(messages.includes("Код ТН ВЭД отсутствует в актуальной редакции товарной номенклатуры"), false);
  const work = createSeedWorks(today).find((item) => item.id === 18502);
  assert.ok(work);
  thin.goods[0].appendIds = [1];
  assert.equal(
    checkLiconfirm(thin).some((item) => item.description === "Не указаны технические характеристики для сравнения с пунктами приложения к лицензии"),
    true,
  );
  assert.equal(
    liconfirmSendBlockers(thin, work).includes("В работе отсутствует проект заключения. Создайте проект заключения."),
    true,
  );
});
