import type { Work } from "./domain.ts";
import { formatDateTime } from "./plan.ts";

export function OrderCard({ work, onClose }: { work: Work; onClose: () => void }) {
  return (
    <article className="panel card">
      <h2>Заказ {work.orderNum}</h2>
      <p className="lede">
        В настольной программе кнопка «КАРТОЧКА» открывает ссылку orderUrl во внешнем приложении. Здесь
        показаны сведения заказа, которые уже есть в плане.
      </p>
      <div className="facts">
        <div className="field">
          <span>Работа</span>
          <p>{work.id}</p>
        </div>
        <div className="field">
          <span>Заказчик</span>
          <p>{work.clientName}</p>
        </div>
        <div className="field">
          <span>Срок выдачи</span>
          <p>{formatDateTime(work.orderTerm) || "—"}</p>
        </div>
        <div className="field">
          <span>Ссылка</span>
          <p>{work.orderUrl}</p>
        </div>
      </div>
      <div className="actions">
        <button type="button" onClick={onClose}>
          Закрыть
        </button>
      </div>
    </article>
  );
}
