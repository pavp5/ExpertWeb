import { useEffect, useMemo, useState } from "react";
import { closeWorkspace, createStartupSettings, initialShell, keyId } from "./workspace.ts";

export function App() {
  const settings = useMemo(() => createStartupSettings(), []);
  const [shell, setShell] = useState(() => initialShell(settings));
  const active = shell.windows.find((window) => keyId(window.key) === shell.activeKey) ?? null;

  useEffect(() => {
    document.title = active?.title ?? "Приложение закрыто";
  }, [active]);

  if (shell.shutdown || !active) {
    return (
      <main className="shutdown">
        <h1>Приложение закрыто</h1>
        <p>Последнее окно рабочей области закрыто.</p>
      </main>
    );
  }

  return (
    <section className="host" aria-label={active.title}>
      <header className="titlebar">
        <h1>{active.title}</h1>
        <button type="button" onClick={() => setShell((current) => closeWorkspace(current, keyId(active.key)))}>
          Закрыть
        </button>
      </header>
      <div className="canvas">
        <p className="db-id">{active.dbId}</p>
      </div>
    </section>
  );
}
