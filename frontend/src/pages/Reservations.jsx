import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import {
  KeyRound, Search, Pencil, Trash2, ArrowRight, CheckCircle2, Clock3, XCircle, ClipboardList, Ban, MapPin, AlertTriangle,
  FileText, Upload, Eye,
} from "lucide-react";
import {
  getCustomerReservations, getPendingReservations, getAllReservations, getPayments,
  approveReservation, rejectReservation, cancelReservation, deleteReservation, uploadPaymentProof, openPaymentProof,
} from "../api/reservationApi";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../utils/errors";
import { useLiveRefresh } from "../utils/useLiveRefresh";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import { SkeletonList } from "../components/Skeleton";
import { checkPdf } from "../utils/pdf";
import { Alert, Badge, Button, Card, FilterTabs, PageHeader, PublicHero, Textarea } from "../components/ui";
import { cx, fieldCls, statusLabel } from "../components/styles";

const fmtPrice = (p) => `LKR ${Number(p ?? 0).toLocaleString("en-US")}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";
const fmtShort = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—";

const HELP = {
  APPROVED:  { Icon: CheckCircle2, msg: "Your reservation is confirmed. Our team will contact you to finalise the sale agreement.", cls: "bg-green-50 border-green-200 text-green-800" },
  PENDING:   { Icon: Clock3, msg: "Your reservation is under review. An Operations Manager will verify your advance payment shortly.", cls: "bg-amber-50 border-amber-200 text-amber-800" },
  REJECTED:  { Icon: XCircle, msg: "Your reservation was not approved.", cls: "bg-red-50 border-red-200 text-red-700" },
  CANCELLED: { Icon: Ban, msg: "This reservation was cancelled.", cls: "bg-grey-50 border-grey-200 text-grey-600" },
};

/** Shows the reservation's payment-proof PDF with View, and Upload/Replace while it can still change. */
function ProofRow({ reservation: r, canUpload, onUpload, uploading, compact = false }) {
  const toast = useToast();
  const inputRef = useRef(null);
  const [opening, setOpening] = useState(false);

  const view = async () => {
    setOpening(true);
    try {
      await openPaymentProof(r.reservationId);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Couldn't open the payment proof."));
    } finally {
      setOpening(false);
    }
  };

  const choose = (file) => {
    if (!file) return;
    const problem = checkPdf(file);
    if (problem) { toast.error(problem); return; }
    onUpload(file);
  };

  return (
    <div className={cx("flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3",
      r.hasPaymentProof ? "border-green-200 bg-green-50/60" : "border-dashed border-amber-300 bg-amber-50/60")}>
      <span className={cx("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
        r.hasPaymentProof ? "bg-white text-green-600" : "bg-white text-amber-600")}><FileText size={18} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-grey-400">Payment proof</p>
        <p className="text-sm font-medium text-primary truncate">
          {r.hasPaymentProof ? (r.paymentProofFileName || "payment-proof.pdf") : compact ? "Not uploaded yet" : "Not uploaded yet — upload your transfer slip (PDF) so we can approve"}
        </p>
      </div>
      {r.hasPaymentProof && <Button size="sm" variant="secondary" icon={Eye} loading={opening} onClick={view}>View PDF</Button>}
      {canUpload && (
        <>
          <Button size="sm" variant={r.hasPaymentProof ? "ghost" : "accent"} icon={Upload} loading={uploading} onClick={() => inputRef.current?.click()}>
            {r.hasPaymentProof ? "Replace" : "Upload proof"}
          </Button>
          <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="sr-only"
            onChange={(e) => { choose(e.target.files?.[0]); e.target.value = ""; }} />
        </>
      )}
    </div>
  );
}

function ReservationCard({ reservation: r, onCancel, onEdit, onDelete, onUploadProof, uploading, busy }) {
  const help = HELP[r.status];
  const canCancel = r.status === "PENDING" || r.status === "APPROVED";
  const canManage = r.status === "PENDING";
  return (
    <Card className="p-6 lg:p-8 flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-grey-400 uppercase tracking-wider font-medium mb-1">Reservation Request</p>
          <h2 className="font-serif text-2xl font-semibold text-primary">{r.apartmentTitle || `Apartment #${r.apartmentId}`}</h2>
        </div>
        <Badge status={r.status} />
      </div>

      {help && (
        <div className={cx("rounded-xl border px-4 py-3 text-sm flex items-start gap-3", help.cls)}>
          <help.Icon size={17} className="flex-shrink-0 mt-0.5" />
          <p>{r.status === "REJECTED" && r.rejectionReason ? <><b>Reason:</b> {r.rejectionReason}</> : help.msg}</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          ["Advance Paid", fmtPrice(r.totalPaidAmount)],
          ["Payment Verified", r.paymentVerified ? "Yes" : "Pending"],
          ["Submitted", fmtDate(r.reservationDate)],
          ["Reference", `RES-${r.reservationId}`],
        ].map(([label, value]) => (
          <div key={label} className="bg-off-white rounded-xl p-3">
            <p className="text-xs text-grey-400 mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-primary">{value}</p>
          </div>
        ))}
      </div>

      <ProofRow reservation={r} canUpload={r.status === "PENDING"} uploading={uploading} onUpload={(file) => onUploadProof(r, file)} />

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-grey-100">
        <Link to={`/apartments/${r.apartmentId}`} className="text-sm text-accent-dark font-medium hover:underline flex items-center gap-1">
          View apartment details <ArrowRight size={14} />
        </Link>
        {(canManage || canCancel) && (
          <div className="flex flex-wrap gap-2">
            {canManage && <Button size="sm" variant="secondary" icon={Pencil} disabled={busy} onClick={() => onEdit(r)}>Edit</Button>}
            {canManage && <Button size="sm" variant="danger-ghost" icon={Trash2} disabled={busy} onClick={() => onDelete(r)}>Delete</Button>}
            {canCancel && <Button size="sm" variant="danger-ghost" loading={busy} onClick={() => onCancel(r)}>Cancel Reservation</Button>}
          </div>
        )}
      </div>
    </Card>
  );
}

function CustomerReservations({ userId }) {
  const { openModal, activeModal } = useModal();
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);

  const handleUploadProof = async (reservation, file) => {
    setUploadingId(reservation.reservationId);
    try {
      const updated = await uploadPaymentProof(reservation.reservationId, file);
      setRows((s) => s.map((r) => (r.reservationId === updated.reservationId ? updated : r)));
      toast.success("Payment proof uploaded. We'll review it shortly.");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Couldn't upload the payment proof."));
    } finally {
      setUploadingId(null);
    }
  };

  const load = useCallback(async () => {
    try {
      setRows(await getCustomerReservations(userId));
      setError("");
    } catch {
      setError("Could not load your reservations.");
      setRows([]);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load);

  const prevModalRef = useRef(activeModal);
  useEffect(() => {
    if ((prevModalRef.current === "editReservation" || prevModalRef.current === "reserveApartment") && activeModal === null) load();
    prevModalRef.current = activeModal;
  }, [activeModal, load]);

  const handleCancelConfirmed = async () => {
    setBusyId(cancelTarget.reservationId);
    try {
      const updated = await cancelReservation(cancelTarget.reservationId);
      setRows((s) => s.map((r) => (r.reservationId === updated.reservationId ? updated : r)));
      toast.success("Reservation cancelled.");
      setCancelTarget(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to cancel reservation."));
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      await deleteReservation(deleteTarget.reservationId);
      toast.success("Reservation deleted.");
      setRows((s) => s.filter((r) => r.reservationId !== deleteTarget.reservationId));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete reservation."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PublicHero title="My Reservations" subtitle="Track the status of your apartment reservation requests." />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 pb-16">
        {error && <Alert className="mb-6">{error}</Alert>}
        {rows === null && <SkeletonList rows={2} height={260} />}
        {rows !== null && rows.length === 0 && !error && (
          <Card>
            <EmptyState icon={KeyRound} title="No reservations yet"
              description="When you reserve an apartment, it will appear here with its full status."
              actionTo="/apartments" actionLabel="Browse Apartments" />
          </Card>
        )}
        {rows !== null && rows.length > 0 && (
          <div className="flex flex-col gap-6">
            {rows.map((r) => (
              <ReservationCard key={r.reservationId} reservation={r} busy={busyId === r.reservationId}
                onUploadProof={handleUploadProof} uploading={uploadingId === r.reservationId}
                onCancel={setCancelTarget} onEdit={(res) => openModal("editReservation", res)} onDelete={setDeleteTarget} />
            ))}
            <div className="bg-primary rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="font-serif text-xl font-semibold text-white mb-1">Looking for more options?</p>
                <p className="text-white/50 text-sm">Browse our latest available apartments.</p>
              </div>
              <Button to="/apartments" variant="accent">Browse Apartments</Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel Reservation"
        description={cancelTarget ? `Cancel your reservation for "${cancelTarget.apartmentTitle}"? ${cancelTarget.status === "APPROVED" ? "The apartment will become available to others again." : ""}` : ""}
        confirmLabel="Cancel Reservation"
        loading={!!busyId}
        onConfirm={handleCancelConfirmed}
        onCancel={() => setCancelTarget(null)}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Reservation"
        description={deleteTarget ? `Delete your reservation request for "${deleteTarget.apartmentTitle || `Apartment #${deleteTarget.apartmentId}`}"? This cannot be undone.` : ""}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

const METHOD_LABEL = { CARD: "Card", BANK_TRANSFER: "Bank Transfer", ONLINE: "Online Payment", CASH: "Cash" };

/** Right-hand detail for one reservation; keyed by id so its draft state resets per selection. */
function ReservationDetail({ reservation: selected, conflict, userId, onUpdated }) {
  const toast = useToast();
  const [payments, setPayments] = useState(null);
  const [busy, setBusy] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    getPayments(selected.reservationId)
      .then((p) => { if (!cancelled) setPayments(p); })
      .catch(() => { if (!cancelled) setPayments([]); });
    return () => { cancelled = true; };
  }, [selected.reservationId]);

  const handleApprove = async () => {
    setBusy(true);
    try {
      onUpdated(await approveReservation(selected.reservationId, userId));
      toast.success("Reservation approved — apartment is now reserved.");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to approve reservation."));
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setBusy(true);
    try {
      onUpdated(await rejectReservation(selected.reservationId, userId, rejectReason.trim()));
      toast.success("Reservation rejected.");
      setRejecting(false);
      setRejectReason("");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to reject reservation."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {conflict && (
        <Alert tone="warning">
          <p className="font-semibold">Apartment already reserved</p>
          <p className="text-xs mt-0.5">Another reservation for this apartment is already approved. Approving this one may cause a conflict.</p>
        </Alert>
      )}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="font-semibold text-primary text-lg">{selected.customerName || `Customer #${selected.customerId}`}</p>
            <Link to={`/apartments/${selected.apartmentId}`} className="text-sm text-grey-400 hover:text-accent-dark flex items-center gap-1">
              <MapPin size={13} /> {selected.apartmentTitle}
            </Link>
          </div>
          <Badge status={selected.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            ["Submitted", fmtDate(selected.reservationDate)],
            ["Reference", `RES-${selected.reservationId}`],
            ["Payment verified", selected.paymentVerified ? "Yes" : "Not yet"],
            ["Reviewed by", selected.operationsManagerName || "—"],
          ].map(([l, v]) => (
            <div key={l} className="bg-off-white rounded-xl p-3">
              <p className="text-xs text-grey-400 mb-0.5">{l}</p>
              <p className="text-sm font-medium text-primary">{v}</p>
            </div>
          ))}
        </div>

        <div className="bg-primary rounded-xl p-5 mb-5">
          <div className="flex items-center justify-between gap-4 mb-3">
            <p className="text-white/50 text-xs uppercase tracking-wider">Payment Record</p>
            <div className="text-right">
              <p className="text-white/60 text-xs">Total paid</p>
              <p className="text-2xl font-bold text-accent-light">{fmtPrice(selected.totalPaidAmount)}</p>
            </div>
          </div>
          {payments === null && <div className="skeleton h-10 opacity-20" />}
          {payments?.length === 0 && <p className="text-sm text-white/50">No payment records found.</p>}
          {payments?.length > 0 && (
            <ul className="divide-y divide-white/10">
              {[...payments].sort((a, b) => a.paymentNo - b.paymentNo).map((p) => (
                <li key={p.paymentNo} className="flex items-center justify-between gap-4 py-2 text-sm">
                  <span className="text-white/70">#{p.paymentNo} · {METHOD_LABEL[p.paymentMethod] ?? p.paymentMethod}</span>
                  <span className="text-white/50 text-xs">{fmtShort(p.paymentDate)}</span>
                  <span className="text-white font-medium">{fmtPrice(p.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-5"><ProofRow reservation={selected} canUpload={false} compact /></div>

        {selected.status === "REJECTED" && selected.rejectionReason && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700 mb-5">
            <strong className="block text-xs mb-0.5">Rejection reason</strong>{selected.rejectionReason}
          </div>
        )}

        {selected.status === "PENDING" && !rejecting && (
          <div className="flex flex-col gap-2">
            <div className="flex gap-3">
              <Button fullWidth loading={busy} icon={CheckCircle2} disabled={!selected.hasPaymentProof} onClick={handleApprove}>Approve Reservation</Button>
              <Button fullWidth variant="danger" disabled={busy} onClick={() => setRejecting(true)}>Reject</Button>
            </div>
            {!selected.hasPaymentProof && (
              <p className="text-xs text-grey-400">Approval unlocks once the customer uploads their payment proof. You can still reject the request.</p>
            )}
          </div>
        )}
        {selected.status === "PENDING" && rejecting && (
          <div className="flex flex-col gap-3">
            <Textarea id="res-reject-reason" label="Reason for rejection" autoFocus placeholder="e.g. The advance payment could not be verified…"
              value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => { setRejecting(false); setRejectReason(""); }}>Cancel</Button>
              <Button variant="danger" icon={AlertTriangle} loading={busy} disabled={!rejectReason.trim()} onClick={handleReject}>Confirm Reject</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function OMApprovalQueue({ userId }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(async () => {
    try {
      const requests = [getPendingReservations(), getAllReservations()];
      const results = await Promise.all(requests);
      const merged = new Map();
      results.flat().forEach((r) => merged.set(r.reservationId, r));
      setRows(Array.from(merged.values()).sort((a, b) => new Date(b.reservationDate) - new Date(a.reservationDate)));
      setError("");
    } catch {
      setError("Could not load reservations.");
      setRows([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load);

  const counts = useMemo(() => {
    const c = { ALL: rows?.length ?? 0 };
    (rows ?? []).forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.toLowerCase();
    return rows.filter((r) => (filter === "ALL" || r.status === filter)
      && (r.apartmentTitle?.toLowerCase().includes(q) || r.customerName?.toLowerCase().includes(q)));
  }, [rows, search, filter]);

  const selected = (selectedId != null && rows?.find((r) => r.reservationId === selectedId)) || filtered[0] || null;

  const update = (updated) => {
    setRows((s) => s.map((r) => (r.reservationId === updated.reservationId ? updated : r)));
    setSelectedId(updated.reservationId);
  };
  const changeFilter = (next) => { setFilter(next); setSelectedId(null); };

  const conflict = !!selected && selected.status === "PENDING"
    && rows.some((r) => r.reservationId !== selected.reservationId && r.apartmentId === selected.apartmentId && r.status === "APPROVED");

  const tabs = ["ALL", "PENDING", "APPROVED", "REJECTED", "CANCELLED"];

  return (
    <div>
      <PageHeader title="Reservation Management"
        subtitle="Verify each advance payment, then approve or reject the reservation."
        actions={<FilterTabs options={tabs.map((t) => ({ value: t, label: t === "ALL" ? "All" : statusLabel(t) }))} value={filter} onChange={changeFilter} counts={counts} />} />

      {error && <Alert className="mb-6">{error}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2 overflow-hidden self-start">
          <div className="p-3 border-b border-grey-100">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-400 pointer-events-none" />
              <input className={fieldCls(false, "pl-10")} placeholder="Search customer or apartment…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="divide-y divide-grey-100 max-h-[620px] overflow-y-auto">
            {rows === null && <div className="p-4"><SkeletonList rows={4} height={60} /></div>}
            {rows !== null && filtered.length === 0 && (
              <EmptyState icon={ClipboardList} title="No reservations" description={filter === "PENDING" ? "Nothing is waiting for approval." : "Nothing matches this filter."} />
            )}
            {filtered.map((r) => {
              const active = selected?.reservationId === r.reservationId;
              return (
                <button key={r.reservationId} type="button" onClick={() => setSelectedId(r.reservationId)}
                  className={cx("w-full text-left px-5 py-4 hover:bg-off-white transition-colors border-l-[3px]",
                    active ? "bg-primary/5 border-primary" : "border-transparent")}>
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-primary truncate">{r.customerName || `Customer #${r.customerId}`}</p>
                      <p className="text-xs text-grey-400 mt-0.5 truncate">{r.apartmentTitle}</p>
                    </div>
                    <Badge status={r.status} size="xs" showDot={false} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-grey-400">
                    <span>{fmtShort(r.reservationDate)}</span>
                    <span className="font-medium text-primary">{fmtPrice(r.totalPaidAmount)}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="lg:col-span-3">
          {selected
            ? <ReservationDetail key={selected.reservationId} reservation={selected} conflict={conflict} userId={userId} onUpdated={update} />
            : (
              <Card className="flex items-center justify-center py-20">
                <EmptyState icon={ClipboardList} title="Select a reservation" description="Pick a reservation on the left to see its details." />
              </Card>
            )}
        </div>
      </div>
    </div>
  );
}

function Reservations() {
  const { role, userId } = useAuth();
  if (role === "OPERATIONS_MANAGER" || role === "ADMIN") return <OMApprovalQueue userId={userId} />;
  return <CustomerReservations userId={userId} />;
}

export default Reservations;
