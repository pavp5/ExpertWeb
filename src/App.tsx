import { useEffect, useMemo, useRef, useState } from "react";
import { CURRENT_EXPERT, type Work } from "./domain.ts";
import { CustomsCard } from "./CustomsCard.tsx";
import { checkCustoms, cloneCustoms, createCustomsDossiers, customsSendBlockers, customsSendWarnings, type CustomsDossier } from "./customs.ts";
import { ConsultationCard } from "./ConsultationCard.tsx";
import { checkConsultation, cloneConsultation, consultationSendBlockers, createConsultationDossiers, type ConsultationDossier } from "./consultation.ts";
import { LiconfirmCard } from "./LiconfirmCard.tsx";
import { checkLiconfirm, cloneLiconfirm, createLiconfirmDossiers, liconfirmSendBlockers, type LiconfirmDossier } from "./liconfirm.ts";
import { TnvedCard } from "./TnvedCard.tsx";
import { checkTnved, cloneTnved, createTnvedDossiers, tnvedSendBlockers, type TnvedDossier } from "./tnved.ts";
import { ExcontCard, sendBlockers } from "./ExcontCard.tsx";
import { checkExcont, cloneDossier, createExcontDossiers, sendWarnings, type CheckIssue, type ExcontDossier } from "./excont.ts";
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
  const seedDossiers = useMemo(() => createExcontDossiers(), []);
  const seedCustoms = useMemo(() => createCustomsDossiers(), []);
  const seedTnved = useMemo(() => createTnvedDossiers(), []);
  const seedLiconfirm = useMemo(() => createLiconfirmDossiers(), []);
  const seedConsultation = useMemo(() => createConsultationDossiers(), []);
  const [works, setWorks] = useState<Work[]>(() => createSeedWorks(started));
  const [dossiers, setDossiers] = useState<Record<number, ExcontDossier>>(() => createExcontDossiers());
  const [customs, setCustoms] = useState<Record<number, CustomsDossier>>(() => createCustomsDossiers());
  const [tnved, setTnved] = useState<Record<number, TnvedDossier>>(() => createTnvedDossiers());
  const [liconfirm, setLiconfirm] = useState<Record<number, LiconfirmDossier>>(() => createLiconfirmDossiers());
  const [consultation, setConsultation] = useState<Record<number, ConsultationDossier>>(() => createConsultationDossiers());
  const [dirty, setDirty] = useState<Record<number, boolean>>({});
  const [issues, setIssues] = useState<CheckIssue[]>([]);
  const [cardNotice, setCardNotice] = useState<string | null>(null);
  const [pendingClose, setPendingClose] = useState<string | null>(null);
  const [pendingSend, setPendingSend] = useState<number | null>(null);
  const [pendingWarns, setPendingWarns] = useState<string[]>([]);
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
    setCardNotice(null);
  }

  function saveDossier(workId: number) {
    const dossier = dossiers[workId];
    const customsDossier = customs[workId];
    const tnvedDossier = tnved[workId];
    const liconfirmDossier = liconfirm[workId];
    const consultationDossier = consultation[workId];
    const description = dossier?.description ?? customsDossier?.description ?? tnvedDossier?.description ?? liconfirmDossier?.description ?? consultationDossier?.description;
    if (description == null) return;
    setDirty((current) => ({ ...current, [workId]: false }));
    setWorks((current) => current.map((work) => {
      if (work.id !== workId) return work;
      return liconfirmDossier ? { ...work, description, comment: liconfirmDossier.comment } : { ...work, description };
    }));
    setCardNotice(dossier ? "Данные работы сохранены." : "Данные сохранены.");
  }

  function reloadDossier(workId: number) {
    const source = seedDossiers[workId];
    const customsSource = seedCustoms[workId];
    const tnvedSource = seedTnved[workId];
    const liconfirmSource = seedLiconfirm[workId];
    const consultationSource = seedConsultation[workId];
    if (!source && !customsSource && !tnvedSource && !liconfirmSource && !consultationSource) return;
    if (source) setDossiers((current) => ({ ...current, [workId]: cloneDossier(source) }));
    if (customsSource) setCustoms((current) => ({ ...current, [workId]: cloneCustoms(customsSource) }));
    if (tnvedSource) setTnved((current) => ({ ...current, [workId]: cloneTnved(tnvedSource) }));
    if (liconfirmSource) setLiconfirm((current) => ({ ...current, [workId]: cloneLiconfirm(liconfirmSource) }));
    if (consultationSource) setConsultation((current) => ({ ...current, [workId]: cloneConsultation(consultationSource) }));
    setDirty((current) => ({ ...current, [workId]: false }));
    setIssues([]);
    setCardNotice(source && !customsSource && !tnvedSource && !liconfirmSource && !consultationSource ? "Данные перечитаны." : null);
  }

  function requestSend(workId: number) {
    setPendingWarns([]);
    setPendingSend(workId);
  }

  function confirmSend(workId: number) {
    const work = works.find((item) => item.id === workId);
    if (!work) {
      setPendingSend(null);
      return;
    }
    if (work.type === "customUnion") {
      const dossier = customs[workId];
      if (!dossier) {
        setPendingSend(null);
        return;
      }
      const found = checkCustoms(dossier);
      setIssues(found);
      const blockers = customsSendBlockers(dossier, work);
      if (blockers.length > 0) {
        setPendingSend(null);
        setPendingWarns([]);
        setCardNotice(blockers[0]);
        return;
      }
      const warns = customsSendWarnings(dossier);
      if (warns.length > 0) {
        setPendingWarns(warns);
        return;
      }
      finishSend(workId);
      return;
    }
    if (work.type === "tnved") {
      const dossier = tnved[workId];
      if (!dossier) {
        setPendingSend(null);
        return;
      }
      const found = checkTnved(dossier);
      setIssues(found);
      const blockers = tnvedSendBlockers(dossier, work);
      if (blockers.length > 0) {
        setPendingSend(null);
        setPendingWarns([]);
        setCardNotice(blockers[0]);
        return;
      }
      finishSend(workId);
      return;
    }
    if (work.type === "liconfirm") {
      const dossier = liconfirm[workId];
      if (!dossier) {
        setPendingSend(null);
        return;
      }
      const found = checkLiconfirm(dossier);
      setIssues(found);
      const blockers = liconfirmSendBlockers(dossier, work);
      if (blockers.length > 0) {
        setPendingSend(null);
        setPendingWarns([]);
        setCardNotice(blockers[0]);
        return;
      }
      finishSend(workId);
      return;
    }
    if (work.type === "consultation") {
      const dossier = consultation[workId];
      if (!dossier) {
        setPendingSend(null);
        return;
      }
      const found = checkConsultation(dossier);
      setIssues(found);
      const blockers = consultationSendBlockers(dossier, work);
      if (blockers.length > 0) {
        setPendingSend(null);
        setPendingWarns([]);
        setCardNotice(blockers[0]);
        return;
      }
      finishSend(workId);
      return;
    }
    const dossier = dossiers[workId];
    if (!dossier) {
      setPendingSend(null);
      return;
    }
    const found = checkExcont(dossier);
    setIssues(found);
    const blockers = sendBlockers(dossier, work);
    if (blockers.length > 0) {
      setPendingSend(null);
      setPendingWarns([]);
      setCardNotice(blockers[0]);
      return;
    }
    const warns = sendWarnings(dossier);
    if (warns.length > 0) {
      setPendingWarns(warns);
      return;
    }
    finishSend(workId);
  }

  function confirmWarn() {
    const rest = pendingWarns.slice(1);
    if (rest.length > 0) {
      setPendingWarns(rest);
      return;
    }
    const workId = pendingSend;
    setPendingWarns([]);
    if (workId != null) finishSend(workId);
  }

  function finishSend(workId: number) {
    const description = dossiers[workId]?.description ?? customs[workId]?.description ?? tnved[workId]?.description ?? liconfirm[workId]?.description ?? consultation[workId]?.description;
    setWorks((current) => current.map((work) => work.id === workId
      ? { ...work, condition: "agree", conditionName: "Утверждение", description: description ?? work.description }
      : work));
    setDirty((current) => ({ ...current, [workId]: false }));
    setPendingSend(null);
    setPendingWarns([]);
    closeTab(`work:${workId}`);
    setReloadNote("Работа отправлена на утверждение руководителю экспертизы.");
  }

  function requestClose(tabKey: string, workId: number) {
    const work = works.find((item) => item.id === workId);
    if (work?.condition === "work" && dirty[workId]) {
      setPendingClose(tabKey);
      return;
    }
    closeTab(tabKey);
  }

  function answerClose(choice: "yes" | "no") {
    if (!pendingClose) return;
    const workId = Number(pendingClose.split(":")[1]);
    if (choice === "yes") saveDossier(workId);
    if (choice === "no") reloadDossier(workId);
    const tabKey = pendingClose;
    setPendingClose(null);
    closeTab(tabKey);
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
            <g fill="#243246">
              <rect x="16.4" y="5" width="3.2" height="6" rx="0.5" transform="rotate(0 18 18)" />
              <rect x="16.4" y="5" width="3.2" height="6" rx="0.5" transform="rotate(45 18 18)" />
              <rect x="16.4" y="5" width="3.2" height="6" rx="0.5" transform="rotate(90 18 18)" />
              <rect x="16.4" y="5" width="3.2" height="6" rx="0.5" transform="rotate(135 18 18)" />
              <rect x="16.4" y="5" width="3.2" height="6" rx="0.5" transform="rotate(180 18 18)" />
              <rect x="16.4" y="5" width="3.2" height="6" rx="0.5" transform="rotate(225 18 18)" />
              <rect x="16.4" y="5" width="3.2" height="6" rx="0.5" transform="rotate(270 18 18)" />
              <rect x="16.4" y="5" width="3.2" height="6" rx="0.5" transform="rotate(315 18 18)" />
              <circle cx="18" cy="18" r="7" />
            </g>
            <circle cx="18" cy="18" r="3" fill="#d7e4f2" />
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
              <button
                type="button"
                className="close"
                aria-label={`Закрыть ${tab.title}`}
                onClick={() => {
                  if (tab.kind === "work" && tab.workId != null && works.some((work) => work.id === tab.workId && (work.type === "excont" || work.type === "customUnion" || work.type === "tnved" || work.type === "liconfirm" || work.type === "consultation"))) {
                    requestClose(tab.key, tab.workId);
                  } else {
                    closeTab(tab.key);
                  }
                }}
              >
                ×
              </button>
            )}
          </div>
        ))}
      </nav>
      <main className="workspace">
        <p className="notice">
          Демонстрационные данные той же формы, что карточки ДН, ЗиО, кода ТН ВЭД, подтверждения лицензии и консультации. Строка соединения SQL в репозиториях не задана.
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
        {activeTab.kind === "work" && activeRow && activeRow.work.type === "excont" && dossiers[activeRow.work.id] && (
          <ExcontCard
            work={activeRow.work}
            dossier={dossiers[activeRow.work.id]}
            issues={issues}
            notice={cardNotice}
            onChange={(next) => {
              setDossiers((current) => ({ ...current, [next.workId]: next }));
              setDirty((current) => ({ ...current, [next.workId]: true }));
            }}
            onSave={() => saveDossier(activeRow.work.id)}
            onReload={() => reloadDossier(activeRow.work.id)}
            onCheck={() => setIssues(checkExcont(dossiers[activeRow.work.id]))}
            onSend={() => requestSend(activeRow.work.id)}
            onSign={() => setCardNotice("Подписание итоговых документов выполняется сборкой Cprp.Signature. В этом срезе подпись не ставится.")}
            onClose={() => requestClose(activeTab.key, activeRow.work.id)}
          />
        )}
        {activeTab.kind === "work" && activeRow && activeRow.work.type === "customUnion" && customs[activeRow.work.id] && (
          <CustomsCard
            work={activeRow.work}
            dossier={customs[activeRow.work.id]}
            issues={issues}
            notice={cardNotice}
            onChange={(next) => {
              setCustoms((current) => ({ ...current, [next.workId]: next }));
              setDirty((current) => ({ ...current, [next.workId]: true }));
            }}
            onSave={() => saveDossier(activeRow.work.id)}
            onReload={() => reloadDossier(activeRow.work.id)}
            onCheck={() => {
              const found = checkCustoms(customs[activeRow.work.id]);
              setIssues(found);
              setCardNotice(found.length === 0 ? "Ошибок нет." : "В работе обнаружены ошибки.");
            }}
            onSend={() => requestSend(activeRow.work.id)}
            onSign={() => setCardNotice("Подписание создает документы через DocumentCreate и переносит работу в архив. В этом срезе подпись не ставится.")}
            onClose={() => requestClose(activeTab.key, activeRow.work.id)}
          />
        )}
        {activeTab.kind === "work" && activeRow && activeRow.work.type === "tnved" && tnved[activeRow.work.id] && (
          <TnvedCard
            work={activeRow.work}
            dossier={tnved[activeRow.work.id]}
            issues={issues}
            notice={cardNotice}
            onChange={(next) => {
              setTnved((current) => ({ ...current, [next.workId]: next }));
              setDirty((current) => ({ ...current, [next.workId]: true }));
            }}
            onSave={() => saveDossier(activeRow.work.id)}
            onReload={() => reloadDossier(activeRow.work.id)}
            onCheck={() => {
              const found = checkTnved(tnved[activeRow.work.id]);
              setIssues(found);
              setCardNotice(found.length === 0 ? "Ошибок нет." : "В работе обнаружены ошибки.");
            }}
            onSend={() => requestSend(activeRow.work.id)}
            onSign={() => setCardNotice("Подписание создает документы через DocumentCreate и переносит работу в архив. В этом срезе подпись не ставится.")}
            onClose={() => requestClose(activeTab.key, activeRow.work.id)}
          />
        )}
        {activeTab.kind === "work" && activeRow && activeRow.work.type === "liconfirm" && liconfirm[activeRow.work.id] && (
          <LiconfirmCard
            work={activeRow.work}
            dossier={liconfirm[activeRow.work.id]}
            issues={issues}
            notice={cardNotice}
            onChange={(next) => {
              setLiconfirm((current) => ({ ...current, [next.workId]: next }));
              setDirty((current) => ({ ...current, [next.workId]: true }));
            }}
            onSave={() => saveDossier(activeRow.work.id)}
            onReload={() => reloadDossier(activeRow.work.id)}
            onCheck={() => {
              const found = checkLiconfirm(liconfirm[activeRow.work.id]);
              setIssues(found);
              setCardNotice(found.length === 0 ? "Ошибок нет." : "В работе обнаружены ошибки.");
            }}
            onSend={() => requestSend(activeRow.work.id)}
            onSign={() => setCardNotice("Подписание создает документы через DocumentCreate и переносит работу в архив. В этом срезе подпись не ставится.")}
            onClose={() => requestClose(activeTab.key, activeRow.work.id)}
          />
        )}
        {activeTab.kind === "work" && activeRow && activeRow.work.type === "consultation" && consultation[activeRow.work.id] && (
          <ConsultationCard
            work={activeRow.work}
            dossier={consultation[activeRow.work.id]}
            issues={issues}
            notice={cardNotice}
            onChange={(next) => {
              setConsultation((current) => ({ ...current, [next.workId]: next }));
              setDirty((current) => ({ ...current, [next.workId]: true }));
            }}
            onSave={() => saveDossier(activeRow.work.id)}
            onReload={() => reloadDossier(activeRow.work.id)}
            onCheck={() => {
              const found = checkConsultation(consultation[activeRow.work.id]);
              setIssues(found);
              setCardNotice(found.length === 0 ? "Ошибок нет." : "В работе обнаружены ошибки.");
            }}
            onSend={() => requestSend(activeRow.work.id)}
            onSign={() => setCardNotice("Подписание создает документы через DocumentCreate и переносит работу в архив. В этом срезе подпись не ставится.")}
            onClose={() => requestClose(activeTab.key, activeRow.work.id)}
          />
        )}
        {activeTab.kind === "work" && activeRow && activeRow.work.type !== "excont" && activeRow.work.type !== "customUnion" && activeRow.work.type !== "tnved" && activeRow.work.type !== "liconfirm" && activeRow.work.type !== "consultation" && (
          <WorkCard row={activeRow} onClose={() => closeTab(activeTab.key)} onOrder={openOrder} />
        )}
        {activeTab.kind === "order" && activeWork?.orderUrl && (
          <OrderCard work={activeWork} onClose={() => closeTab(activeTab.key)} />
        )}
        {activeTab.kind !== "plan" && activeTab.kind !== "work" && activeTab.kind !== "order" && (
          <LaterScreen kind={activeTab.kind} />
        )}
      </main>
      {pendingSend != null && (
        <div className="dialog-backdrop">
          <div className="dialog" role="alertdialog" aria-labelledby="send-title">
            <h2 id="send-title">Работа № {pendingSend}</h2>
            <p>{pendingWarns[0] ?? "Отправить работу на утверждение руководителю экспертизы?"}</p>
            <div className="row-actions">
              <button type="button" onClick={() => pendingWarns.length > 0 ? confirmWarn() : confirmSend(pendingSend)}>Да</button>
              <button type="button" onClick={() => { setPendingSend(null); setPendingWarns([]); }}>Нет</button>
            </div>
          </div>
        </div>
      )}
      {pendingClose != null && (
        <div className="dialog-backdrop">
          <div className="dialog" role="alertdialog" aria-labelledby="close-title">
            <h2 id="close-title">Работа № {pendingClose.split(":")[1]}</h2>
            <p>Данные работы были изменены. Сохранить?</p>
            <div className="row-actions">
              <button type="button" onClick={() => answerClose("yes")}>Да</button>
              <button type="button" onClick={() => answerClose("no")}>Нет</button>
              <button type="button" onClick={() => setPendingClose(null)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
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
