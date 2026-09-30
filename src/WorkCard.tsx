import { WORK_TYPE_MODULE, WORK_TYPE_SID } from "./domain.ts";
import type { PlanRow } from "./plan.ts";
import { formatDateTime } from "./plan.ts";

interface WorkCardProps {
  row: PlanRow;
  onClose: () => void;
  onOrder: (id: number) => void;
}

export function WorkCard({ row, onClose, onOrder }: WorkCardProps) {
  const work = row.work;
  const moduleName = WORK_TYPE_MODULE[work.type];
  return (
    <article className="panel card">
      <h2>Работа #{work.id}</h2>
      <p className="lede">
        {moduleName
          ? `Карточка вида в настольной программе: ${moduleName}. В этом срезе показаны сведения плана, без редактора.`
          : "Для вида «Лиценз.» MainForm.WorkOpen карточку не создаёт. Ниже только сведения плана."}
      </p>
      <div className="facts">
        <Field label="Вид" value={WORK_TYPE_SID[work.type] || "—"} />
        <Field label="Состояние" value={row.conditionLabel} />
        <Field label="Срок исполнения" value={formatDateTime(work.expertTerm)} />
        <Field label="Срок выдачи" value={formatDateTime(work.orderTerm)} />
        <Field label="Объектов" value={String(work.goodCount)} />
        <Field label="Трудоемкость, мин" value={work.totalWork == null ? "" : String(work.totalWork)} />
        <Field label="Заказ" value={work.orderNum} />
        <Field label="Заказчик" value={work.clientName} />
        <Field label="Продукция" value={work.description} />
        <Field label="Менеджер" value={work.managerName} />
        <Field label="Руководитель" value={work.leaderName} />
        <Field label="Оплачена" value={work.isPayment ? "Да" : "Нет"} />
        <Field label="Просрочена" value={row.isExpired ? "Да" : "Нет"} />
        <Field label="Группа плана" value={row.groupText} />
      </div>
      <p className="comment">{work.comment || "Комментария к работе нет."}</p>
      <div className="actions">
        <button type="button" onClick={() => onOrder(work.id)}>
          КАРТОЧКА
        </button>
        <button type="button" className="text-button" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="field">
      <span>{label}</span>
      <p>{value || "—"}</p>
    </div>
  );
}

