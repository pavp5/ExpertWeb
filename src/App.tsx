import { useEffect, useMemo, useRef, useState } from "react";
import { CURRENT_EXPERT } from "./domain.ts";
import { LaterScreen } from "./LaterScreen.tsx";
import { OrderCard } from "./OrderCard.tsx";
import { buildPlan } from "./plan.ts";
import { createSeedWorks } from "./seed.ts";
import { WorkCard } from "./WorkCard.tsx";
import { WorkPlan } from "./WorkPlan.tsx";

const STORAGE_KEY = "expert.isPlaneAccept";

type LaterKind = "search" | "law" | "finfo" | "manual";

interface OpenTab {
  key: string;
  title: string;
  closable: boolean;
  kind: "plan" | "work" | "order" | LaterKind;
  workId?: number;
}

const PLAN_TAB: OpenTab = {
  key: "plan",
  title: "ПЛАН РАБОТ",
  closable: false,
  kind: "plan",
};

const LATER: Record<LaterKind, { title: string; description: string }> = {
  search: {
    title: "Поиск работ",
    description: "Поиск работ в базе данных «Экспертной системы»",
  },
  law: {
    title: "Нормативные документы",
    description: "Сборник нормативно-правовых документов",
  },
  finfo: {
    title: "Контролируемые заключения",
    description: "Перечень заключений с выводами «Требуется лицензия», «Требуется разрешение»",
  },
  manual: {
    title: "Руководство пользователя",
    description: "Руководство пользователя к программе",
  },
};

function readShowAgree(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function App() {
  const started = useMemo(() => new Date(), []);
  const works = useMemo(() => createSeedWorks(started), [started]);
  const [now, setNow] = useState(started);
  const [showAgree, setShowAgree] = useState(readShowAgree);
  const [reloadNote, setReloadNote] = useState<string | null>(null);
  const [tabs, setTabs] = useState<OpenTab[]>([PLAN_TAB]);
  const [active, setActive] = useState("plan");
  const [menuOpen, setMenuOpen] = useState(false);
  const [orderWarningId, setOrderWarningId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const plan = useMemo(
    () => buildPlan(works, CURRENT_EXPERT.id, showAgree, now),
    [works, showAgree, now],
  );
  const allRows = useMemo(
    () => buildPlan(works, CURRENT_EXPERT.id, true, now).rows,
    [works, now],
  );
  const [selectedId, setSelectedId] = useState<number | null>(null);

  useEffect(() => {
    if (!plan.rows.some((row) => row.work.id === selectedId)) {
      setSelectedId(plan.rows[0]?.work.id ?? null);
    }
  }, [plan.rows, selectedId]);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  function persistAgree(value: boolean) {
    setShowAgree(value);
    setReloadNote(null);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      /* настройка останется до перезагрузки страницы */
    }
  }

  function openTab(tab: OpenTab) {
    setTabs((current) => (current.some((item) => item.key === tab.key) ? current : [...current, tab]));
    setActive(tab.key);
    setMenuOpen(false);
  }

  function openWork(id: number) {
    openTab({
      key: `work:${id}`,
      title: `Работа #${id}`,
      closable: true,
      kind: "work",
      workId: id,
    });
  }

  function openOrder(id: number) {
    const work = works.find((item) => item.id === id);
    if (!work) return;
    if (!work.orderUrl) {
      setOrderWarningId(id);
      return;
    }
    openTab({
      key: `order:${id}`,
      title: `Заказ ${work.orderNum}`,
      closable: true,
      kind: "order",
      workId: id,
    });
  }

  function closeTab(key: string) {
    setTabs((current) => current.filter((tab) => tab.key !== key));
    setActive((current) => (current === key ? "plan" : current));
  }

  const activeTab = tabs.find((tab) => tab.key === active) ?? PLAN_TAB;
  const activeRow = allRows.find((row) => row.work.id === activeTab.workId);
  const activeWork = works.find((work) => work.id === activeTab.workId);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
            <circle cx="18" cy="18" r="16" fill="#d7e4f2" />
            <path
              fill="#243246"
              d="M18 8.2 20.1 11l3.2-.6.8 3.1 2.8 1.7-1.5 2.8.6 3.2-3.1.8-1.7 2.8-2.8-1.5-3.2.6-.8-3.1-2.8-1.7 1.5-2.8-.6-3.2 3.1-.8L15.9 11 18 8.2Zm0 4.3a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z"
            />
          </svg>
          <div>
            <h1>Рабочее место эксперта</h1>
            <p>Экспертиза · ЭксКонт</p>
          </div>
        </div>
        <div className="session">{CURRENT_EXPERT.title}</div>
        <div className="menu" ref={menuRef}>
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            Дополнительно
          </button>
          {menuOpen && (
            <div className="menu-panel" role="menu">
              {(Object.keys(LATER) as LaterKind[]).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  role="menuitem"
                  onClick={() =>
                    openTab({
                      key: kind,
                      title: LATER[kind].title,
                      closable: true,
                      kind,
                    })
                  }
                >
                  {LATER[kind].title}
                  <small>{LATER[kind].description}</small>
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      <nav className="tabs" aria-label="Вкладки">
        {tabs.map((tab) => (
          <div key={tab.key} className="tab-group">
            <button
              type="button"
              className="tab"
              role="tab"
              aria-selected={tab.key === active}
              onClick={() => setActive(tab.key)}
            >
              {tab.title}
            </button>
            {tab.closable && (
              <button type="button" className="close" aria-label={`Закрыть ${tab.title}`} onClick={() => closeTab(tab.key)}>
                ×
              </button>
            )}
          </div>
        ))}
      </nav>
      <main className="workspace">
        <p className="notice">
          Демонстрационные данные. База ЭксКонт и сборки Cprp в этом срезе не подключены.
        </p>
        {activeTab.kind === "plan" && (
          <WorkPlan
            rows={plan.rows}
            summary={plan.summary}
            showAgree={showAgree}
            selectedId={selectedId}
            reloadNote={reloadNote}
            onToggleAgree={persistAgree}
            onReload={() => {
              setNow(new Date());
              setReloadNote("План работ перечитан");
            }}
            onSelect={setSelectedId}
            onOpen={openWork}
            onOrder={openOrder}
          />
        )}
        {activeTab.kind === "work" && activeRow && (
          <WorkCard row={activeRow} onClose={() => closeTab(activeTab.key)} onOrder={openOrder} />
        )}
        {activeTab.kind === "order" && activeWork?.orderUrl && (
          <OrderCard work={activeWork} onClose={() => closeTab(activeTab.key)} />
        )}
        {activeTab.kind !== "plan" && activeTab.kind !== "work" && activeTab.kind !== "order" && (
          <LaterScreen kind={activeTab.kind} />
        )}
      </main>
      {orderWarningId != null && (
        <div className="dialog-backdrop">
          <div className="dialog" role="alertdialog" aria-labelledby="order-warning-title" aria-modal="true">
            <h2 id="order-warning-title">Работа № {orderWarningId}</h2>
            <p>Отсутствует ссылка на карточку заказа.</p>
            <button type="button" autoFocus onClick={() => setOrderWarningId(null)}>
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
