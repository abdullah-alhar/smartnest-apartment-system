import { useState, useEffect, useMemo, useRef } from "react";
import { Search, Users as UsersIcon, UserX, UserCheck, UserPlus } from "lucide-react";
import { listAllUsers, deactivateUser, reactivateUser } from "../api/adminApi";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../utils/errors";
import { ROLE_LABEL, initialsOf } from "../utils/roles";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import { SkeletonTableRows } from "../components/Skeleton";
import { Alert, Badge, Button, Card, FilterTabs, PageHeader, Table } from "../components/ui";
import { fieldCls, tdCls } from "../components/styles";

const ROLE_FILTERS = ["ALL", "ADMIN", "SALES_STAFF", "CRO", "OPERATIONS_MANAGER", "MARKETING_EXECUTIVE", "CUSTOMER"];

function Users() {
  const { userId } = useAuth();
  const { openModal, activeModal } = useModal();
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
      setError("");
    } catch {
      setError("Could not load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Refresh after the "Create Staff" modal closes so the new account shows up.
  const prevModalRef = useRef(activeModal);
  useEffect(() => {
    if (prevModalRef.current === "createStaff" && activeModal === null) load();
    prevModalRef.current = activeModal;
  }, [activeModal]);

  const counts = useMemo(() => {
    const c = { ALL: users.length };
    users.forEach((u) => { c[u.role] = (c[u.role] ?? 0) + 1; });
    return c;
  }, [users]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesSearch = !q || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      return matchesRole && matchesSearch;
    });
  }, [users, search, roleFilter]);

  const handleReactivate = async (row) => {
    setActionLoading(true);
    try {
      await reactivateUser(row.userId);
      toast.success(`${row.firstName} ${row.lastName} reactivated.`);
      setUsers((s) => s.map((x) => (x.userId === row.userId ? { ...x, active: true } : x)));
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
      setUsers((s) => s.map((x) => (x.userId === confirmTarget.userId ? { ...x, active: false } : x)));
      setConfirmTarget(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to deactivate account."));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Users & Roles" subtitle="Every account in the system — staff and customers alike."
        actions={<Button icon={UserPlus} onClick={() => openModal("createStaff")}>Create Staff</Button>} />

      <div className="flex flex-col gap-4 mb-6">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-400 pointer-events-none" />
          <input className={fieldCls(false, "pl-10")} placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <FilterTabs options={ROLE_FILTERS.map((r) => ({ value: r, label: r === "ALL" ? "All" : ROLE_LABEL[r] }))}
          value={roleFilter} onChange={setRoleFilter} counts={counts} />
      </div>

      {error && <Alert className="mb-6">{error}</Alert>}

      {!loading && filtered.length === 0 && !error && (
        <Card><EmptyState icon={UsersIcon} title="No users found" description="Try a different search or role filter." /></Card>
      )}

      {(loading || filtered.length > 0) && !error && (
        <Table head={["Name", "Email", "Role", "Status", { label: "Actions", right: true }]}>
          {loading && <SkeletonTableRows columns={5} rows={5} />}
          {!loading && filtered.map((row) => {
            const isSelf = String(row.userId) === String(userId);
            return (
              <tr key={row.userId} className="hover:bg-off-white/60">
                <td className={tdCls}>
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-accent/15 text-accent-dark text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {initialsOf(row.firstName, row.lastName)}
                    </span>
                    <span className="font-medium text-primary whitespace-nowrap">{row.firstName} {row.lastName}{isSelf && <span className="text-grey-400 font-normal"> (you)</span>}</span>
                  </div>
                </td>
                <td className={`${tdCls} text-grey-500`}>{row.email}</td>
                <td className={`${tdCls} text-grey-600 whitespace-nowrap`}>{ROLE_LABEL[row.role] ?? row.role}</td>
                <td className={tdCls}><Badge status={row.active ? "ACTIVE" : "INACTIVE"} /></td>
                <td className={`${tdCls} text-right`}>
                  {row.active ? (
                    <Button size="sm" variant="danger-ghost" icon={UserX} disabled={isSelf || actionLoading}
                      title={isSelf ? "You cannot deactivate your own account" : undefined} onClick={() => setConfirmTarget(row)}>
                      Deactivate
                    </Button>
                  ) : (
                    <Button size="sm" variant="success" icon={UserCheck} disabled={actionLoading} onClick={() => handleReactivate(row)}>Reactivate</Button>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title="Deactivate Account"
        description={confirmTarget ? `Are you sure you want to deactivate ${confirmTarget.firstName} ${confirmTarget.lastName}'s account? They will no longer be able to sign in.` : ""}
        confirmLabel="Deactivate"
        loading={actionLoading}
        onConfirm={handleDeactivateConfirmed}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

export default Users;
