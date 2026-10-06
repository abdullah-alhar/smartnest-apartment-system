import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { MessageCircle, PlusCircle, Search, Send, Inbox, Pencil, Trash2, ArrowRight, Hand, Lock, UserRound } from "lucide-react";
import {
  getCustomerInquiries, getNewInquiries, getCROInquiries, getAllInquiries,
  claimInquiry, respondToInquiry, closeInquiry, deleteInquiry,
} from "../api/inquiryApi";
import { useAuth } from "../context/AuthContext";
import { useModal } from "../context/ModalContext";
import { useToast } from "../context/ToastContext";
import { extractErrorMessage } from "../utils/errors";
import { useLiveRefresh } from "../utils/useLiveRefresh";
import { relativeTime } from "../utils/time";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import { SkeletonList } from "../components/Skeleton";
import { Alert, Badge, Button, Card, FilterTabs, PageHeader, PublicHero, Textarea } from "../components/ui";
import { cx, fieldCls } from "../components/styles";

const fmt = (d) => d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";

function Bubble({ mine, children, meta }) {
  return (
    <div className={cx("flex", mine ? "justify-end" : "justify-start")}>
      <div className={cx("max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm",
        mine ? "bg-primary text-white rounded-br-sm" : "bg-off-white text-primary rounded-bl-sm")}>
        <p className="leading-relaxed whitespace-pre-line">{children}</p>
        {meta && <p className={cx("text-[10px] mt-1", mine ? "text-white/50" : "text-grey-400")}>{meta}</p>}
      </div>
    </div>
  );
}

function InquiryCard({ inquiry: i, onEdit, onDelete }) {
  const canManage = i.status === "NEW";
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <Link to={`/apartments/${i.apartmentId}`} className="font-semibold text-primary hover:text-accent-dark">
            {i.apartmentTitle || `Apartment #${i.apartmentId}`}
          </Link>
          <p className="text-xs text-grey-400 mt-0.5">Asked {fmt(i.createdDate)}</p>
        </div>
        <Badge status={i.status} />
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-grey-100">
        <Bubble mine meta="You">{i.question}</Bubble>
        {i.staffReply
          ? <Bubble meta={i.croName ? `${i.croName} · SmartNest` : "SmartNest team"}>{i.staffReply}</Bubble>
          : (
            <p className="text-xs text-grey-400 italic">
              {i.status === "IN_PROGRESS" ? `${i.croName ?? "A relations officer"} is working on a reply…` : "Waiting for a relations officer to pick this up."}
            </p>
          )}
      </div>

      {canManage && (
        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-grey-100">
          <Button size="sm" variant="secondary" icon={Pencil} onClick={() => onEdit(i)}>Edit Question</Button>
          <Button size="sm" variant="danger-ghost" icon={Trash2} onClick={() => onDelete(i)}>Delete</Button>
        </div>
      )}
    </Card>
  );
}

function CustomerInquiries({ userId }) {
  const { openModal, activeModal } = useModal();
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setRows(await getCustomerInquiries(userId));
      setError("");
    } catch {
      setError("Could not load your inquiries.");
      setRows([]);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load);

  const prevModalRef = useRef(activeModal);
  useEffect(() => {
    if ((prevModalRef.current === "editInquiry" || prevModalRef.current === "createInquiry") && activeModal === null) load();
    prevModalRef.current = activeModal;
  }, [activeModal, load]);

  const handleDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      await deleteInquiry(deleteTarget.inquiryId);
      toast.success("Inquiry deleted.");
      setRows((s) => s.filter((r) => r.inquiryId !== deleteTarget.inquiryId));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete inquiry."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PublicHero title="My Inquiries" subtitle="Questions you've sent about SmartNest listings, and our team's replies."
        actions={<Button variant="accent" icon={PlusCircle} onClick={() => openModal("createInquiry")}>Ask a Question</Button>} />

      <div className="max-w-[1100px] mx-auto px-4 sm:px-8 pb-16">
        {error && <Alert className="mb-6">{error}</Alert>}
        {rows === null && <SkeletonList rows={2} height={200} />}
        {rows !== null && rows.length === 0 && !error && (
          <Card>
            <EmptyState icon={MessageCircle} title="No inquiries yet" description="Ask about an apartment and our Customer Relations team will reply here."
              actionOnClick={() => openModal("createInquiry")} actionLabel="Ask a Question" />
          </Card>
        )}
        {rows !== null && rows.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {rows.map((r) => (
              <InquiryCard key={r.inquiryId} inquiry={r} onEdit={(i) => openModal("editInquiry", i)} onDelete={setDeleteTarget} />
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Inquiry"
        description={deleteTarget ? `Delete your question about "${deleteTarget.apartmentTitle || `Apartment #${deleteTarget.apartmentId}`}"? This cannot be undone.` : ""}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

/** Reply composer for one inquiry; keyed by inquiry so the draft resets when the selection changes. */
function ReplyBox({ inquiry, busy, act }) {
  const [replyText, setReplyText] = useState("");
  return (
    <div className="flex flex-col gap-3">
      <Textarea id="inq-reply" label="Your reply" placeholder="Type your reply to the customer…" value={replyText}
        onChange={(e) => setReplyText(e.target.value)} className="bg-white" />
      <div className="flex flex-wrap gap-2 justify-end">
        {inquiry.status === "NEW" && (
          <Button variant="secondary" icon={Hand} disabled={busy}
            onClick={() => act(() => claimInquiry(inquiry.inquiryId), "Inquiry claimed.", "Failed to claim inquiry.")}>
            Claim
          </Button>
        )}
        <Button icon={Send} loading={busy} disabled={!replyText.trim()}
          onClick={() => act(() => respondToInquiry(inquiry.inquiryId, replyText.trim()), "Reply sent.", "Failed to send reply.", () => setReplyText(""))}>
          Send Reply
        </Button>
      </div>
    </div>
  );
}

function CROInbox({ userId }) {
  const toast = useToast();
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const requests = [getNewInquiries(), getCROInquiries(userId), getAllInquiries()];
      const results = await Promise.all(requests);
      const merged = new Map();
      results.flat().forEach((i) => merged.set(i.inquiryId, i));
      setRows(Array.from(merged.values()).sort((a, b) => b.inquiryId - a.inquiryId));
      setError("");
    } catch {
      setError("Could not load inquiries.");
      setRows([]);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);
  useLiveRefresh(load);

  const isOpen = (r) => r.status === "NEW" || r.status === "IN_PROGRESS";
  const counts = useMemo(() => {
    const c = { ALL: rows?.length ?? 0, OPEN: 0 };
    (rows ?? []).forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; if (isOpen(r)) c.OPEN += 1; });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.toLowerCase();
    return rows.filter((r) => (filter === "ALL" || (filter === "OPEN" ? isOpen(r) : r.status === filter))
      && (r.question?.toLowerCase().includes(q) || r.apartmentTitle?.toLowerCase().includes(q) || r.customerName?.toLowerCase().includes(q)));
  }, [rows, search, filter]);

  const selected = (selectedId != null && rows?.find((r) => r.inquiryId === selectedId)) || filtered[0] || null;

  const update = (updated) => {
    setRows((s) => s.map((r) => (r.inquiryId === updated.inquiryId ? updated : r)));
    setSelectedId(updated.inquiryId);
  };
  const changeFilter = (next) => { setFilter(next); setSelectedId(null); };

  const act = async (fn, success, fallback, after) => {
    setBusy(true);
    try {
      update(await fn());
      toast.success(success);
      after?.();
    } catch (err) {
      toast.error(extractErrorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const tabs = [
    { value: "ALL", label: "All" }, { value: "OPEN", label: "Open" }, { value: "NEW", label: "New" },
    { value: "IN_PROGRESS", label: "In Progress" }, { value: "RESPONDED", label: "Responded" }, { value: "CLOSED", label: "Closed" },
  ];

  return (
    <div>
      <PageHeader title="Inquiries Inbox" subtitle="Customer questions about listings — claim, reply and close them here."
        actions={<FilterTabs options={tabs} value={filter} onChange={changeFilter} counts={counts} />} />

      {error && <Alert className="mb-6">{error}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-2 overflow-hidden self-start">
          <div className="p-3 border-b border-grey-100">
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-grey-400 pointer-events-none" />
              <input className={fieldCls(false, "pl-10")} placeholder="Search inquiries…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="divide-y divide-grey-100 max-h-[620px] overflow-y-auto">
            {rows === null && <div className="p-4"><SkeletonList rows={4} height={64} /></div>}
            {rows !== null && filtered.length === 0 && (
              <EmptyState icon={Inbox} title="Inbox zero" description="New customer questions will show up here." />
            )}
            {filtered.map((r) => {
              const active = selected?.inquiryId === r.inquiryId;
              return (
                <button key={r.inquiryId} type="button" onClick={() => setSelectedId(r.inquiryId)}
                  className={cx("w-full text-left px-5 py-4 hover:bg-off-white transition-colors border-l-[3px]",
                    active ? "bg-primary/5 border-primary" : "border-transparent")}>
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <p className="text-sm font-medium text-primary truncate">{r.customerName || `Customer #${r.customerId}`}</p>
                    <Badge status={r.status} size="xs" showDot={false} />
                  </div>
                  <p className="text-xs text-grey-400 truncate mb-1">{r.apartmentTitle}</p>
                  <p className="text-xs text-grey-500 line-clamp-1">{r.question}</p>
                </button>
              );
            })}
          </div>
        </Card>

        <div className="lg:col-span-3">
          {!selected ? (
            <Card className="py-20"><EmptyState icon={MessageCircle} title="Select an inquiry" description="Pick a conversation on the left to read and reply." /></Card>
          ) : (
            <Card className="flex flex-col">
              <div className="px-6 py-5 border-b border-grey-100 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-semibold text-primary text-lg flex items-center gap-2"><UserRound size={17} className="text-grey-400" />{selected.customerName || `Customer #${selected.customerId}`}</p>
                  <Link to={`/apartments/${selected.apartmentId}`} className="text-sm text-grey-400 hover:text-accent-dark flex items-center gap-1">
                    {selected.apartmentTitle} <ArrowRight size={13} />
                  </Link>
                </div>
                <div className="text-right">
                  <Badge status={selected.status} />
                  <p className="text-xs text-grey-400 mt-1">{relativeTime(selected.createdDate)}</p>
                </div>
              </div>

              <div className="px-6 py-6 flex flex-col gap-3 min-h-[180px]">
                <Bubble meta={`${selected.customerName ?? "Customer"} · ${fmt(selected.createdDate)}`}>{selected.question}</Bubble>
                {selected.staffReply && <Bubble mine meta={selected.croName ? `${selected.croName} · SmartNest` : "SmartNest"}>{selected.staffReply}</Bubble>}
                {selected.status === "IN_PROGRESS" && !selected.staffReply && (
                  <p className="text-xs text-grey-400 italic">Claimed by {selected.croName ?? "a relations officer"}.</p>
                )}
              </div>

              <div className="px-6 py-5 border-t border-grey-100 bg-grey-50 rounded-b-2xl">
                {isOpen(selected) && <ReplyBox key={selected.inquiryId} inquiry={selected} busy={busy} act={act} />}
                {selected.status === "RESPONDED" && (
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-grey-500">Replied. Close the inquiry once the customer has what they need.</p>
                    <Button variant="danger-ghost" icon={Lock} loading={busy}
                      onClick={() => act(() => closeInquiry(selected.inquiryId), "Inquiry closed.", "Failed to close inquiry.")}>
                      Close Inquiry
                    </Button>
                  </div>
                )}
                {selected.status === "CLOSED" && <p className="text-sm text-grey-400">This inquiry is closed.</p>}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Inquiries() {
  const { role, userId } = useAuth();
  if (role === "CRO" || role === "ADMIN") return <CROInbox userId={userId} />;
  return <CustomerInquiries userId={userId} />;
}

export default Inquiries;
