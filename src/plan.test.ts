import assert from "node:assert/strict";
import { test } from "node:test";
import { CURRENT_EXPERT } from "./domain.ts";
import { buildPlan, formatSummary } from "./plan.ts";
import { createSeedWorks } from "./seed.ts";

const now = new Date("2026-09-30T09:00:00.000Z");

test("план эксперта повторяет фильтр, группы, просрочку и трудоёмкость", () => {
  const plan = buildPlan(createSeedWorks(now), CURRENT_EXPERT.id, false, now);
  assert.deepEqual(
    plan.rows.map((row) => row.work.id),
    [18420, 18502, 18488, 18455, 18312, 18540, 18580, 18510, 18471, 18402, 18610],
  );
  assert.equal(plan.summary.total, 11);
  assert.equal(plan.summary.expired, 2);
  assert.equal(plan.summary.laborMinutes, 750);
  assert.equal(formatSummary(plan.summary), "Весь план: 11. Просрочено: 2. Суммарная трудоемкость: 12 ч. 30 мин.");

  const byId = new Map(plan.rows.map((row) => [row.work.id, row]));
  assert.equal(byId.get(18502)?.groupText, "1. Подписание");
  assert.equal(byId.get(18502)?.conditionLabel, "В работе (подписание запроса)");
  assert.equal(byId.get(18488)?.isExpired, false);
  assert.equal(byId.get(18488)?.conditionLabel, "В работе (направлено в госорган)");
  assert.equal(byId.get(18455)?.isExpired, true);
  assert.equal(byId.get(18580)?.isExpired, true);
  assert.equal(byId.get(18510)?.isExpired, false);
  assert.equal(byId.get(18510)?.conditionLabel, "В работе (утверждение запроса)");
  assert.equal(byId.get(18312)?.conditionLabel, "В работе (остановлена)");
  assert.equal(byId.get(18540)?.conditionLabel, "В работе (направлен запрос)");
  assert.equal(byId.get(18471)?.sId, "Измен.");
  assert.equal(byId.get(18471)?.conditionLabel, "В работе (утверждение документа)");
  assert.equal(byId.get(18402)?.sId, "");
  assert.equal(plan.rows.some((row) => row.work.id === 18390), false);
  assert.equal(plan.rows.some((row) => row.work.id === 18200), false);
  assert.equal(plan.rows.some((row) => row.work.id === 18560), false);
});

test("флажок «Утверждение» возвращает работы на утверждении и не меняет трудоёмкость", () => {
  const hidden = buildPlan(createSeedWorks(now), CURRENT_EXPERT.id, false, now);
  const shown = buildPlan(createSeedWorks(now), CURRENT_EXPERT.id, true, now);
  assert.equal(shown.summary.total, 12);
  assert.equal(shown.summary.laborMinutes, hidden.summary.laborMinutes);
  assert.equal(shown.rows.at(-1)?.work.id, 18390);
  assert.equal(shown.rows.at(-1)?.groupText, "3. Утверждение");
});
