import { Clock, CheckCircle2, XCircle } from "lucide-react";

const CONFIG = {
  PENDING:  { cls: "badge-pending",  Icon: Clock,        label: "Pending"  },
  APPROVED: { cls: "badge-approved", Icon: CheckCircle2, label: "Approved" },
  REJECTED: { cls: "badge-rejected", Icon: XCircle,      label: "Rejected" },
  ACTIVE:   { cls: "badge-approved", Icon: CheckCircle2, label: "Active"   },
  INACTIVE: { cls: "badge-rejected", Icon: XCircle,      label: "Inactive" },
};

function StatusBadge({ status }) {
  const { cls, Icon, label } = CONFIG[status] ?? { cls: "badge-info", Icon: Clock, label: status ?? "Unknown" };
  return (
    <span className={`badge ${cls}`}>
      <Icon size={12} strokeWidth={2.5} />
      {label}
    </span>
  );
}

export default StatusBadge;
