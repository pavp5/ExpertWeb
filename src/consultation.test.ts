import assert from "node:assert/strict";
import { test } from "node:test";
import { createSeedWorks } from "./seed.ts";
import {
  buildConsultationTree,
  checkConsultation,
  cloneConsultation,
  createConsultationDossiers,
  consultationSendBlockers,
} from "./consultation.ts";

const today = new Date("2026-09-30T12:00:00");

test("дерево консультации содержит только план и вопросы", () => {
  const tree = buildConsultationTree(createConsultationDossiers()[18312]);
  assert.deepEqual(
    tree.filter((node) => node.parentId == null).map((node) => node.caption),
    ["ПЛАН РАБОТЫ", "ПОСТАВЛЕННЫЕ ВОПРОСЫ"],
  );
  assert.equal(tree.some((node) => node.caption.startsWith("1. Относится ли комплект датчиков")), true);
  assert.equal(tree.some((node) => node.caption.includes("ЛИЦЕНЗ")), false);
});

test("заполненная карточка консультации проходит проверку и отправку", () => {
  const ready = createConsultationDossiers()[18312];
  const work = createSeedWorks(today).find((item) => item.id === 18312);
  assert.ok(work);
  assert.equal(work.type, "consultation");
  assert.equal(work.isStop, true);
  assert.equal(work.goodCount, 1);
  assert.equal(work.totalWork, 30);
  assert.deepEqual(checkConsultation(ready), []);
  assert.deepEqual(consultationSendBlockers(ready, work), []);
});

test("пустая карточка консультации сообщает про документы, вопрос и проект", () => {
  const thin = cloneConsultation(createConsultationDossiers()[18312]);
  thin.description = "";
  thin.documents = [];
  thin.project1 = "";
  thin.queries = [{ id: 3, rowNum: 1, ask: "", ans: "" }];
  const messages = checkConsultation(thin).map((item) => item.description);
  assert.equal(messages.includes("Не указано обобщенное наименование объектов экспертизы"), true);
  assert.equal(messages.includes("Отсутствуют документы, использованные при проведении экспертизы"), true);
  assert.equal(messages.includes("Не указан вопрос"), true);
  assert.equal(messages.includes("Не указан ответ"), true);
  assert.equal(messages.includes("Отсутствуют вопросы"), false);
  const work = createSeedWorks(today).find((item) => item.id === 18312);
  assert.ok(work);
  assert.equal(
    consultationSendBlockers(thin, work).includes("В работе отсутствует проект заключения. Создайте проект заключения."),
    true,
  );
});
