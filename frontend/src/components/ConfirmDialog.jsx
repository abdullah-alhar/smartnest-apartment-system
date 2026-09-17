import { Loader2, AlertTriangle } from "lucide-react";

function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", danger = true, loading, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">
          <AlertTriangle size={20} style={{ verticalAlign: -4, marginRight: 8, color: "var(--warning)" }} />
          {title}
        </h2>
        {description && <p className="modal-desc">{description}</p>}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
          <button className={`btn ${danger ? "btn-danger" : "btn-primary"}`} onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 size={15} className="icon-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
