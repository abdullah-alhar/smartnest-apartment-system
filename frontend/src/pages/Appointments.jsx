import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays, PlusCircle, Search, Pencil, Trash2, Clock3, ArrowRight, UserRound, Check, CalendarClock, X, CalendarCheck,
} from "lucide-react";
import {
  getCustomerAppointments, getPendingAppointments, getCROAppointments, getAllAppointments,
  approveAppointment, rescheduleAppointment, declineAppointment, completeAppointment, cancelAppointment,
  deleteAppointment,
} from "../api/appointmentApi";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../utils/errors";
import { useLiveRefresh } from "../utils/useLiveRefresh";
import { toBackendLocalDateTime } from "../utils/time";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import { SkeletonList } from "../components/Skeleton";
import { Alert, Badge, Button, Card, FilterTabs, PageHeader, PublicHero } from "../components/ui";
import { cx, fieldCls, statusLabel } from "../components/styles";

const fmtDay = (iso) => iso ? new Date(iso).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "long", year: "numeric" }) : "—";
const fmtTime = (iso) => iso ? new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "—";
const fmtDateTime = (iso) => iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—";
const OPEN = ["PENDING", "APPROVED", "RESCHEDULED"];

function DateTile({ iso }) {
  const d = iso ? new Date(iso) : null;
  return (
    <div className="w-16 flex-shrink-0 rounded-2xl bg-primary text-white text-center py-2.5">
      <p className="text-[10px] uppercase tracking-widest text-accent">{d ? d.toLocaleDateString("en-US", { month: "short" }) : "—"}</p>
      <p className="text-2xl font-bold leading-tight">{d ? d.getDate() : "?"}</p>
      <p className="text-[10px] text-white/50">{d ? d.toLocaleDateString("en-US", { weekday: "short" }) : ""}</p>
    </div>
  );
}

function AppointmentCard({ appointment: a, onCancel, onEdit, onDelete, busy }) {
  const when = a.scheduledDate ?? a.requestedDate;
  const canCancel = OPEN.includes(a.status);
  const canManage = a.status === "PENDING";
  return (
    <Card className="p-6 flex flex-col sm:flex-row gap-5">
      <DateTile iso={when} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div className="min-w-0">
            <h2 className="font-semibold text-primary text-lg">{a.apartmentTitle || `Apartment #${a.apartmentId}`}</h2>
            <p className="text-sm text-grey-400">{fmtDay(when)} · {fmtTime(when)}</p>
          </div>
          <Badge status={a.status} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {[
            ["Requested for", fmtDateTime(a.requestedDate)],
            ["Confirmed slot", a.scheduledDate ? fmtDateTime(a.scheduledDate) : "Awaiting confirmation"],
            ["Relations officer", a.croName || "Not assigned yet"],
          ].map(([l, v]) => (
            <div key={l} className="bg-off-white rounded-xl p-3">
              <p className="text-xs text-grey-400 mb-0.5">{l}</p>
              <p className="text-sm font-semibold text-primary">{v}</p>
            </div>
          ))}
        </div>
        {a.status === "DECLINED" && a.declineReason && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700 mb-4"><b>Reason:</b> {a.declineReason}</div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-grey-100">
          <Link to={`/apartments/${a.apartmentId}`} className="text-sm text-accent-dark font-medium hover:underline flex items-center gap-1">
            View apartment <ArrowRight size={14} />
          </Link>
          {(canManage || canCancel) && (
            <div className="flex flex-wrap gap-2">
              {canManage && <Button size="sm" variant="secondary" icon={Pencil} disabled={busy} onClick={() => onEdit(a)}>Edit</Button>}
              {canManage && <Button size="sm" variant="danger-ghost" icon={Trash2} disabled={busy} onClick={() => onDelete(a)}>Delete</Button>}
              {canCancel && <Button size="sm" variant="danger-ghost" loading={busy} onClick={() => onCancel(a)}>Cancel Visit</Button>}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function CustomerAppointments({ userId }) {
  const { openModal, activeModal } = useModal();
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await getCustomerAppointments(userId));
      setError("");
    } catch {
      setError("Could not load your appointments.");
      setRows([]);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load);

  const prevModalRef = useRef(activeModal);
  useEffect(() => {
    if ((prevModalRef.current === "editAppointment" || prevModalRef.current === "bookAppointment") && activeModal === null) load();
    prevModalRef.current = activeModal;
  }, [activeModal, load]);

  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      await deleteAppointment(deleteTarget.appointmentId);
      toast.success("Appointment deleted.");
      setRows((s) => s.filter((r) => r.appointmentId !== deleteTarget.appointmentId));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete appointment."));
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelConfirmed = async () => {
    setBusyId(cancelTarget.appointmentId);
    try {
      const updated = await cancelAppointment(cancelTarget.appointmentId);
      setRows((s) => s.map((r) => (r.appointmentId === updated.appointmentId ? updated : r)));
      toast.success("Appointment cancelled.");
      setCancelTarget(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to cancel appointment."));
    } finally {
      setBusyId(null);
    }
  };

  const upcoming = (rows ?? []).filter((r) => OPEN.includes(r.status));
  const past = (rows ?? []).filter((r) => !OPEN.includes(r.status));

  return (
    <div>
      <PublicHero title="My Site Visits" subtitle="Your requested and confirmed apartment viewings."
        actions={<Button variant="accent" icon={PlusCircle} onClick={() => openModal("bookAppointment")}>Book a Visit</Button>} />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 pb-16">
        {error && <Alert className="mb-6">{error}</Alert>}
        {rows === null && <SkeletonList rows={2} height={200} />}
        {rows !== null && rows.length === 0 && !error && (
          <Card>
            <EmptyState icon={CalendarDays} title="No site visits yet" description="Book a guided viewing to tour an apartment in person."
              actionOnClick={() => openModal("bookAppointment")} actionLabel="Book a Visit" />
          </Card>
        )}
        {upcoming.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs font-semibold text-grey-500 uppercase tracking-wider mb-4">Upcoming</h2>
            <div className="flex flex-col gap-4">
              {upcoming.map((r) => (
                <AppointmentCard key={r.appointmentId} appointment={r} busy={busyId === r.appointmentId}
                  onCancel={setCancelTarget} onEdit={(a) => openModal("editAppointment", a)} onDelete={setDeleteTarget} />
              ))}
            </div>
          </section>
        )}
        {past.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-grey-500 uppercase tracking-wider mb-4">Past &amp; closed</h2>
            <div className="flex flex-col gap-4 opacity-90">
              {past.map((r) => (
                <AppointmentCard key={r.appointmentId} appointment={r} busy={busyId === r.appointmentId}
                  onCancel={setCancelTarget} onEdit={(a) => openModal("editAppointment", a)} onDelete={setDeleteTarget} />
              ))}
            </div>
          </section>
        )}
      </div>

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel Site Visit"
        description={cancelTarget ? `Cancel your site visit for "${cancelTarget.apartmentTitle}"?` : ""}
        confirmLabel="Cancel Visit"
        loading={!!busyId}
        onConfirm={handleCancelConfirmed}
        onCancel={() => setCancelTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Visit Request"
        description={deleteTarget ? `Delete your visit request for "${deleteTarget.apartmentTitle || `Apartment #${deleteTarget.apartmentId}`}"? This cannot be undone.` : ""}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function CROQueue({ userId }) {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [busyId, setBusyId] = useState(null);
  const [mode, setMode] = useState(null); // { id, kind: "reschedule" | "decline" }
  const [value, setValue] = useState("");

  const load = useCallback(async () => {
    try {
      const requests = [getPendingAppointments(), getCROAppointments(userId), getAllAppointments()];
      const results = await Promise.all(requests);
      const merged = new Map();
      results.flat().forEach((a) => merged.set(a.appointmentId, a));
      setRows(Array.from(merged.values()).sort((a, b) => new Date(a.requestedDate) - new Date(b.requestedDate)));
      setError("");
    } catch {
      setError("Could not load appointments.");
      setRows([]);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load);

  const counts = useMemo(() => {
    const c = { ALL: rows?.length ?? 0, OPEN: 0 };
    (rows ?? []).forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; if (OPEN.includes(r.status)) c.OPEN += 1; });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.toLowerCase();
    return rows.filter((r) => (filter === "ALL" || (filter === "OPEN" ? OPEN.includes(r.status) : r.status === filter))
      && (r.apartmentTitle?.toLowerCase().includes(q) || r.customerName?.toLowerCase().includes(q)));
  }, [rows, search, filter]);

  const update = (updated) => setRows((s) => s.map((r) => (r.appointmentId === updated.appointmentId ? updated : r)));
  const closeMode = () => { setMode(null); setValue(""); };

  const run = async (row, fn, success, fallback) => {
    setBusyId(row.appointmentId);
    try {
      update(await fn());
      toast.success(success);
      closeMode();
    } catch (err) {
      toast.error(extractErrorMessage(err, fallback));
    } finally {
      setBusyId(null);
    }
  };

  const tabs = [
    { value: "ALL", label: "All" }, { value: "OPEN", label: "Open" }, { value: "PENDING", label: "Pending" },
    { value: "COMPLETED", label: "Completed" }, { value: "DECLINED", label: "Declined" },
  ];

  return (
    <div>
      <PageHeader title="Appointment Requests" subtitle="Site-visit requests — approve, reschedule, decline, or mark them complete."
        actions={<FilterTabs options={tabs} value={filter} onChange={setFilter} counts={counts} />} />

      <div className="relative max-w-sm mb-6">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-400 pointer-events-none" />
        <input className={fieldCls(false, "pl-10")} placeholder="Search customer or apartment…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error && <Alert className="mb-6">{error}</Alert>}
      {rows === null && <SkeletonList rows={4} height={96} />}
      {rows !== null && filtered.length === 0 && !error && (
        <Card><EmptyState icon={Clock3} title="No appointments" description="New site-visit requests will show up here." /></Card>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((row) => {
          const isOpen = OPEN.includes(row.status);
          const busy = busyId === row.appointmentId;
          const editing = mode?.id === row.appointmentId ? mode.kind : null;
          const when = row.scheduledDate ?? row.requestedDate;
          return (
            <Card key={row.appointmentId} className="p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <DateTile iso={when} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-primary">{row.apartmentTitle || `Apartment #${row.apartmentId}`}</p>
                    <Badge status={row.status} size="xs" />
                  </div>
                  <p className="text-sm text-grey-500 flex items-center gap-1.5"><UserRound size={14} /> {row.customerName || `Customer #${row.customerId}`}</p>
                  <p className="text-xs text-grey-400 mt-1">
                    Requested {fmtDateTime(row.requestedDate)}
                    {row.scheduledDate && <> · Scheduled <b className="text-primary">{fmtDateTime(row.scheduledDate)}</b></>}
                    {row.croName && <> · {row.croName}</>}
                  </p>
                  {row.status === "DECLINED" && row.declineReason && <p className="text-xs text-red-600 mt-1">Reason: {row.declineReason}</p>}
                </div>
                {!editing && isOpen && (
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {row.status === "PENDING" && (
                      <Button size="sm" variant="success" icon={Check} loading={busy}
                        onClick={() => run(row, () => approveAppointment(row.appointmentId), "Appointment approved.", "Failed to approve.")}>
                        Approve
                      </Button>
                    )}
                    {(row.status === "APPROVED" || row.status === "RESCHEDULED") && (
                      <Button size="sm" icon={CalendarCheck} loading={busy}
                        onClick={() => run(row, () => completeAppointment(row.appointmentId), "Marked as completed.", "Failed to mark completed.")}>
                        Complete
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" icon={CalendarClock} disabled={busy} onClick={() => { setMode({ id: row.appointmentId, kind: "reschedule" }); setValue(""); }}>Reschedule</Button>
                    <Button size="sm" variant="danger-ghost" icon={X} disabled={busy} onClick={() => { setMode({ id: row.appointmentId, kind: "decline" }); setValue(""); }}>Decline</Button>
                  </div>
                )}
              </div>

              {editing && (
                <div className={cx("mt-4 pt-4 border-t border-grey-100 flex flex-col sm:flex-row gap-3 sm:items-end")}>
                  <div className="flex-1">
                    <label className="text-sm font-medium text-primary-light mb-1.5 block">
                      {editing === "reschedule" ? "New date & time (09:00–17:00)" : "Reason for declining"}
                    </label>
                    {editing === "reschedule"
                      ? <input type="datetime-local" className={fieldCls(false)} autoFocus value={value} onChange={(e) => setValue(e.target.value)} />
                      : <input className={fieldCls(false)} autoFocus placeholder="e.g. The unit is being renovated that week…" value={value} onChange={(e) => setValue(e.target.value)} />}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={closeMode}>Cancel</Button>
                    {editing === "reschedule"
                      ? (
                        <Button loading={busy} disabled={!value}
                          onClick={() => run(row, () => rescheduleAppointment(row.appointmentId, toBackendLocalDateTime(value)), "Appointment rescheduled.", "Failed to reschedule.")}>
                          Confirm
                        </Button>
                      )
                      : (
                        <Button variant="danger" loading={busy} disabled={!value.trim()}
                          onClick={() => run(row, () => declineAppointment(row.appointmentId, value.trim()), "Appointment declined.", "Failed to decline.")}>
                          Decline Visit
                        </Button>
                      )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {rows !== null && filtered.length > 0 && filter !== "ALL" && (
        <p className="text-xs text-grey-400 mt-4">Showing {filtered.length} {filter === "OPEN" ? "open" : statusLabel(filter).toLowerCase()} appointment{filtered.length !== 1 ? "s" : ""}.</p>
      )}
    </div>
  );
}

function Appointments() {
  const { role, userId } = useAuth();
  if (role === "CRO" || role === "ADMIN") return <CROQueue userId={userId} />;
  return <CustomerAppointments userId={userId} />;
}

export default Appointments;
