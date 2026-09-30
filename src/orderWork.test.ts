import assert from "node:assert/strict";
import { test } from "node:test";
import { createSeedWorks } from "./seed.ts";
import {
  createOrderDossiers,
  orderAcceptWarning,
  orderWorkCaption,
} from "./orderWork.ts";

const today = new Date("2026-09-30T12:00:00");

test("заявка 18402 в плане без подписи вида и с пустым перечнем работ", () => {
  const work = createSeedWorks(today).find((item) => item.id === 18402);
  assert.ok(work);
  assert.equal(work.type, "order");
  assert.equal(work.orderUrl, null);
  assert.equal(work.totalWork, 50);
  assert.equal(work.condition, "work");
  const dossier = createOrderDossiers()[18402];
  assert.equal(dossier.services.length, 0);
  assert.equal(orderAcceptWarning(dossier.services), "Работы не выбраны. Выберите работы, необходимые для исполнения заказа.");
  assert.equal(orderWorkCaption(work), "№ 18402 / Рассмотрение заявки на оказание услуг / В работе");
});

test("утверждение требует вид работы у каждой выбранной строки", () => {
  assert.equal(
    orderAcceptWarning([{ id: 1, typeId: null, expertId: 17, managerId: 1 }]),
    "У выбранной работы отсутствует вид работы. Укажите вид работы.",
  );
  assert.equal(
    orderAcceptWarning([{ id: 1, typeId: 5, expertId: null, managerId: null }]),
    null,
  );
});
