import { useState, useEffect, useMemo } from "react";
import { Search, Users as UsersIcon, UserX, UserCheck, UserPlus, Loader2 } from "lucide-react";
import { listAllUsers, deactivateUser, reactivateUser } from "../api/adminApi";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../utils/errors";
import StatusBadge from "../components/StatusBadge";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import { SkeletonTableRows } from "../components/Skeleton";

const ROLE_LABEL = {
  ADMIN: "Administrator",
  SALES_STAFF: "Sales Staff",
  CRO: "Chief Revenue Officer",
  OPERATIONS_MANAGER: "Operations Manager",
  MANAGING_DIRECTOR: "Managing Director",
  MARKETING_EXECUTIVE: "Marketing Executive",
  CUSTOMER: "Customer",
};

const ROLE_FILTERS = ["ALL", "ADMIN", "SALES_STAFF", "CRO", "OPERATIONS_MANAGER", "MARKETING_EXECUTIVE", "CUSTOMER"];

function Users() {
  const { userId } = useAuth();
  const { openModal } = useModal();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await listAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesSearch = !q
        || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
        || u.email.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const handleReactivate = async (row) => {
    setActionLoading(true);
    try {
      await reactivateUser(row.userId);
      toast.success(`${row.firstName} ${row.lastName} reactivated.`);
      setUsers((s) => s.map((x) => x.userId === row.userId ? { ...x, active: true } : x));
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to reactivate account."));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivateConfirmed = async () => {
    setActionLoading(true);
    try {
      await deactivateUser(confirmTarget.userId);
      toast.success(`${confirmTarget.firstName} ${confirmTarget.lastName} deactivated.`);
      setUsers((s) => s.map((x) => x.userId === confirmTarget.userId ? { ...x, active: false } : x));
      setConfirmTarget(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to deactivate account."));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">View and manage every account in the system — staff and customers alike.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openModal("createStaff")}>
          <UserPlus size={15} /> Create Staff
        </button>
      </div>

      <div className="flex gap-3 mb-6" style={{ flexWrap: "wrap", alignItems: "center" }}>
        <div className="input-icon-wrap" style={{ flex: 1, minWidth: 220, maxWidth: 360 }}>
          <Search size={15} className="input-icon" />
          <input
            className="form-input has-icon"
            placeholder="Search by name or email…"
            value={search} onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="role-filter-tabs">
          {ROLE_FILTERS.map((r) => (
            <button
              key={r} type="button"
              className={`role-filter-tab ${roleFilter === r ? "active" : ""}`}
              onClick={() => setRoleFilter(r)}
            >
              {r === "ALL" ? "All" : ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="alert alert-error mb-6">{error}</div>}

      {!loading && filtered.length === 0 && !error && (
        <EmptyState icon={UsersIcon} title="No Users Found" description="Try a different search or role filter." />
      )}

      {(loading || filtered.length > 0) && !error && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && <SkeletonTableRows columns={5} rows={5} />}
              {!loading && filtered.map((row) => {
                const isSelf = String(row.userId) === String(userId);
                return (
                  <tr key={row.userId}>
                    <td className="cell-title">{row.firstName} {row.lastName}</td>
                    <td className="cell-muted">{row.email}</td>
                    <td>{ROLE_LABEL[row.role] ?? row.role}</td>
                    <td><StatusBadge status={row.active ? "ACTIVE" : "INACTIVE"} /></td>
                    <td>
                      <div className="cell-actions">
                        {row.active ? (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={isSelf || actionLoading}
                            title={isSelf ? "You cannot deactivate your own account" : undefined}
                            onClick={() => setConfirmTarget(row)}
                          >
                            <UserX size={14} /> Deactivate
                          </button>
                        ) : (
                          <button
                            className="btn btn-success btn-sm"
                            disabled={actionLoading}
                            onClick={() => handleReactivate(row)}
                          >
                            <UserCheck size={14} /> Reactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title="Deactivate Account"
        description={confirmTarget ? `Are you sure you want to deactivate ${confirmTarget.firstName} ${confirmTarget.lastName}'s account? They will no longer be able to log in.` : ""}
        confirmLabel={actionLoading ? <Loader2 size={15} className="icon-spin" /> : "Deactivate"}
        loading={actionLoading}
        onConfirm={handleDeactivateConfirmed}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

export default Users;
