import assert from "node:assert/strict";
import { test } from "node:test";
import { createSeedWorks } from "./seed.ts";
import {
  alterationSendBlockers,
  alterationWorkCaption,
  buildAlterationTree,
  checkAlteration,
  cloneAlteration,
  createAlterationDossiers,
} from "./alteration.ts";

const today = new Date("2026-09-30T12:00:00");

test("дерево изменения содержит только план", () => {
  assert.deepEqual(buildAlterationTree().map((node) => node.caption), ["ПЛАН РАБОТЫ"]);
});

test("заполненная карточка изменения проходит проверку плана и отправку письма", () => {
  const ready = createAlterationDossiers()[18471];
  const work = createSeedWorks(today).find((item) => item.id === 18471);
  assert.ok(work);
  assert.equal(work.type, "alteration");
  assert.equal(work.isInt, true);
  assert.equal(work.totalWork, 45);
  assert.deepEqual(checkAlteration(ready, work), []);
  assert.deepEqual(alterationSendBlockers(ready, work), []);
  assert.equal(alterationWorkCaption(work), "№ 18471 / Рассмотрение заявки на внесение изменений / В работе");
  assert.equal(ready.changeSummaryId, 3);
});

test("отправка не смотрит пояснения и требует проект письма", () => {
  const thin = cloneAlteration(createAlterationDossiers()[18471]);
  thin.expertComment = "";
  thin.letter = "";
  const work = createSeedWorks(today).find((item) => item.id === 18471);
  assert.ok(work);
  assert.equal(checkAlteration(thin, work).some((item) => item.description === "Не указаны пояснения эксперта"), true);
  assert.equal(checkAlteration(thin, work).some((item) => item.description === "Не указано обобщенное наименование объектов экспертизы"), false);
  assert.deepEqual(alterationSendBlockers(thin, work), ["В работе отсутствует проект письма. Создайте проект письма."]);
});
