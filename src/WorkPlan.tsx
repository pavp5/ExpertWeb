import { useEffect, useRef } from "react";
import type { PlanRow, PlanSummary } from "./plan.ts";
import { formatDateTime, groupRows } from "./plan.ts";

interface WorkPlanProps {
  rows: PlanRow[];
  summary: PlanSummary;
  showAgree: boolean;
  selectedId: number | null;
  reloadNote: string | null;
  onToggleAgree: (value: boolean) => void;
  onReload: () => void;
  onSelect: (id: number) => void;
  onOpen: (id: number) => void;
  onOrder: (id: number) => void;
}

const COLUMNS = 12;

export function WorkPlan({
  rows,
  summary,
  showAgree,
  selectedId,
  reloadNote,
  onToggleAgree,
  onReload,
  onSelect,
  onOpen,
  onOrder,
}: WorkPlanProps) {
  const selectedRef = useRef<HTMLTableRowElement | null>(null);
  const groups = groupRows(rows);
  const selected = rows.find((row) => row.work.id === selectedId) ?? null;

  useEffect(() => {
    selectedRef.current?.focus();
  }, [selectedId]);

  function move(step: number) {
    if (!selected) return;
    const index = rows.findIndex((row) => row.work.id === selected.work.id);
    const next = rows[index + step];
    if (next) onSelect(next.work.id);
  }

  return (
    <section className="panel" aria-label="План работ">
      <div className="toolbar">
        <div className="tool-group">
          <span>План работ</span>
          <div>
            <button type="button" onClick={onReload}>
              ПЕРЕЧИТАТЬ
            </button>
          </div>
        </div>
        <div className="tool-group">
          <span>Показ</span>
          <label className="check">
            <input
              type="checkbox"
              checked={showAgree}
              onChange={(event) => onToggleAgree(event.target.checked)}
            />
            УТВЕРЖДЕНИЕ
          </label>
        </div>
        <div className="tool-group">
          <span>Работа</span>
          <button type="button" disabled={!selected} onClick={() => selected && onOpen(selected.work.id)}>
            ОТКРЫТЬ
          </button>
        </div>
        <div className="tool-group">
          <span>Заказ</span>
          <button type="button" disabled={!selected} onClick={() => selected && onOrder(selected.work.id)}>
            КАРТОЧКА
          </button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <caption>План работ эксперта</caption>
          <thead>
            <tr>
              <th>Срок исполнения</th>
              <th>Срок выдачи</th>
              <th>Работа</th>
              <th title="Вид услуги">Вид</th>
              <th title="Количество объектов исследования">Объектов</th>
              <th title="Трудоемкость (мин)">Труд.</th>
              <th>Заказ</th>
              <th>Заказчик</th>
              <th>Продукция</th>
              <th>Состояние</th>
              <th>Менеджер</th>
              <th>Руководитель</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <GroupBlock
                key={group.groupText}
                groupText={group.groupText}
                rows={group.rows}
                selectedId={selectedId}
                selectedRef={selectedRef}
                onSelect={onSelect}
                onOpen={onOpen}
                onMove={move}
              />
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="empty" colSpan={COLUMNS}>
                  В плане нет работ.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="status">
        <p>
          Весь план: <strong>{summary.total}</strong>. Просрочено: <strong>{summary.expired}</strong>.
          Суммарная трудоемкость: <strong>{Math.floor(summary.laborMinutes / 60)}</strong> ч.{" "}
          <strong>{summary.laborMinutes % 60}</strong> мин.
        </p>
        {reloadNote ? <p>{reloadNote}</p> : null}
      </div>
    </section>
  );
}

function GroupBlock({
  groupText,
  rows,
  selectedId,
  selectedRef,
  onSelect,
  onOpen,
  onMove,
}: {
  groupText: string;
  rows: PlanRow[];
  selectedId: number | null;
  selectedRef: { current: HTMLTableRowElement | null };
  onSelect: (id: number) => void;
  onOpen: (id: number) => void;
  onMove: (step: number) => void;
}) {
  return (
    <>
      <tr className="group">
        <td colSpan={COLUMNS}>{groupText}</td>
      </tr>
      {rows.map((row) => {
        const selected = row.work.id === selectedId;
        return (
          <tr
            key={row.work.id}
            data-work={row.work.id}
            className={row.isExpired ? "expired" : undefined}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            ref={selected ? selectedRef : undefined}
            onClick={() => onSelect(row.work.id)}
            onDoubleClick={() => onOpen(row.work.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onOpen(row.work.id);
              if (event.key === "ArrowDown") {
                event.preventDefault();
                onMove(1);
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                onMove(-1);
              }
            }}
          >
            <td className="num">{formatDateTime(row.work.expertTerm)}</td>
            <td className="num">{formatDateTime(row.work.orderTerm)}</td>
            <td className="num">{row.work.id}</td>
            <td className={row.sId === "Измен." ? "kind alteration" : "kind"}>{row.sId || "—"}</td>
            <td className="center">{row.work.goodCount}</td>
            <td className="center">{row.work.totalWork ?? ""}</td>
            <td className="num">{row.work.orderNum}</td>
            <td>{row.work.clientName}</td>
            <td>{row.work.description}</td>
            <td>{row.conditionLabel}</td>
            <td>{row.work.managerName}</td>
            <td>{row.work.leaderName}</td>
          </tr>
        );
      })}
    </>
  );
}
