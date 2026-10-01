import assert from "node:assert/strict";
import { test } from "node:test";
import {
  STARTUP_KEY,
  WorkspaceType,
  closeWorkspace,
  createStartupSettings,
  createWorkView,
  emptyShell,
  initialShell,
  keyId,
  openWorkspace,
  roleSuffix,
  workTitle,
  workspaceWindowTitle,
} from "./workspace.ts";

test("старт открывает работу 5 с ролью руководителя", () => {
  const settings = createStartupSettings();
  assert.equal(settings.isExpertMode, true);
  assert.equal(settings.isLeaderMode, true);
  assert.equal(settings.isManagerMode, false);
  assert.equal(roleSuffix(settings), "Руководитель");
  const shell = initialShell(settings);
  assert.equal(shell.shutdown, false);
  assert.equal(shell.windows.length, 1);
  assert.equal(shell.windows[0].dbId, 5);
  assert.equal(shell.windows[0].title, "Работа № 5 - Руководитель");
  assert.equal(shell.activeKey, keyId(STARTUP_KEY));
});

test("заголовок роли и работы совпадает с конвертером", () => {
  assert.equal(roleSuffix({ isExpertMode: true, isLeaderMode: false, isManagerMode: false }), "Эксперт");
  assert.equal(roleSuffix({ isExpertMode: false, isLeaderMode: false, isManagerMode: true }), "Менеджер");
  assert.equal(roleSuffix({ isExpertMode: false, isLeaderMode: false, isManagerMode: false }), "ЭС");
  assert.equal(workTitle(null), "Работа № б/н");
  assert.equal(workspaceWindowTitle(null, createStartupSettings()), "Рабочая область - Руководитель");
});

test("повторное открытие того же ключа не создаёт второе окно", () => {
  const settings = createStartupSettings();
  const once = initialShell(settings);
  const twice = openWorkspace(once, STARTUP_KEY, settings);
  assert.equal(twice.windows.length, 1);
  assert.equal(twice.activeKey, once.activeKey);
});

test("закрытие последнего окна завершает приложение", () => {
  const shell = initialShell();
  const closed = closeWorkspace(shell, keyId(STARTUP_KEY));
  assert.equal(closed.shutdown, true);
  assert.equal(closed.windows.length, 0);
  const ignored = openWorkspace(closed, STARTUP_KEY, createStartupSettings());
  assert.equal(ignored.shutdown, true);
});

test("фабрика собирает только идентификационную экспертизу", () => {
  assert.deepEqual(createWorkView({ type: WorkspaceType.ExcontWork, entityId: 5 }), {
    dbId: 5,
    title: "Работа № 5",
  });
  assert.throws(
    () => createWorkView({ type: WorkspaceType.ActiveWorkList, entityId: 0 }),
    /Неизвестный тип рабочего пространства/,
  );
  assert.throws(
    () => openWorkspace(emptyShell(), { type: WorkspaceType.WorkSearch, entityId: 0 }, createStartupSettings()),
    /Неизвестный тип рабочего пространства/,
  );
});
