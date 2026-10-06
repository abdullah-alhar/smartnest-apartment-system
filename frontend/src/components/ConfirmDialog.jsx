import { AlertTriangle } from "lucide-react";
import { Button, Modal } from "./ui";

function ConfirmDialog({ open, title, description, confirmLabel = "Confirm", danger = true, loading, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={loading ? undefined : onCancel} size="sm" dismissable={!loading}
      footer={(
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      )}>
      <div className="flex gap-4">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${danger ? "bg-red-50 text-red-500" : "bg-accent/10 text-accent"}`}>
          <AlertTriangle size={20} />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-primary mb-1">{title}</h2>
          {description && <p className="text-sm text-grey-500 leading-relaxed">{description}</p>}
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
