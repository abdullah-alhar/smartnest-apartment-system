import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, CircleCheck, CircleX, Clock } from "lucide-react";
import {
  getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead, ENTITY_ROUTES,
} from "../api/notificationApi";
import { useToast } from "../context/ToastContext";
import { relativeTime } from "../utils/time";

const POLL_MS = 30000;

// lets other views (e.g. Home's recent-activity card) refresh when read state changes here
export const NOTIFICATIONS_CHANGED = "sn:notifications-changed";
const announceChange = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));

const TYPE_META = {
  APPROVED:  { Icon: CircleCheck, cls: "approved" },
  REJECTED:  { Icon: CircleX,     cls: "rejected" },
  SUBMITTED: { Icon: Clock,       cls: "submitted" },
};

function NotificationBell() {
  const toast = useToast();
  const navigate = useNavigate();
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [unread, setUnread] = useState(0);

  const refreshCount = useCallback(() => {
    getUnreadCount().then(setUnread).catch(() => {});
  }, []);

  useEffect(() => {
    refreshCount();
    const poll = setInterval(refreshCount, POLL_MS);
    window.addEventListener("focus", refreshCount);
    return () => {
      clearInterval(poll);
      window.removeEventListener("focus", refreshCount);
    };
  }, [refreshCount]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    const onDocClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDocClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDocClick);
    };
  }, [open]);

  const loadList = () => {
    setListLoading(true);
    getNotifications()
      .then((data) => {
        const rows = Array.isArray(data) ? data : [];
        setList(rows);
        setUnread(rows.filter((n) => !n.isRead).length);
      })
      .catch(() => toast.error("Couldn't load notifications. Try again."))
      .finally(() => setListLoading(false));
  };

  const togglePanel = () => {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  };

  // optimistic — flip the row immediately, roll back only if the server refuses
  const openRow = (n) => {
    if (!n.isRead) {
      const prev = list;
      setList(prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      markNotificationRead(n.id)
        .then(announceChange)
        .catch(() => {
          setList(prev);
          setUnread(prev.filter((x) => !x.isRead).length);
          toast.error("Couldn't mark that as read.");
        });
    }
    const route = ENTITY_ROUTES[n.relatedEntityType];
    if (route) {
      setOpen(false);
      navigate(route(n.relatedEntityId));
    }
  };

  const markAll = () => {
    const prev = list;
    setList(prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    markAllNotificationsRead()
      .then(announceChange)
      .catch(() => {
        setList(prev);
        setUnread(prev.filter((n) => !n.isRead).length);
        toast.error("Couldn't mark all as read.");
      });
  };

  return (
    <div className="sn-account" ref={ref}>
      <button type="button" className="sn-icon-btn" title="Notifications" aria-label="Notifications"
        aria-expanded={open} onClick={togglePanel}>
        <Bell size={19} />
        {unread > 0 && <span className="sn-bell-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="sn-notif-panel" role="dialog" aria-label="Notifications">
          <div className="sn-notif-head">
            <div className="sn-notif-heading">
              <span className="sn-notif-title">Notifications</span>
              <span className="sn-notif-caption">{unread > 0 ? `${unread} unread` : "No unread notifications"}</span>
            </div>
            <button type="button" className="sn-notif-markall" disabled={unread === 0} onClick={markAll}>
              Mark all as read
            </button>
          </div>

          <div className="sn-notif-list">
            {listLoading && [1, 2, 3].map((k) => (
              <div key={k} className="sn-notif-skel">
                <div className="sn-notif-skel-dot sn-shimmer" />
                <div className="sn-notif-skel-lines">
                  <div className="sn-notif-skel-line sn-shimmer" style={{ width: "85%" }} />
                  <div className="sn-notif-skel-line sn-shimmer" style={{ width: "55%" }} />
                </div>
              </div>
            ))}

            {!listLoading && list.length === 0 && (
              <div className="sn-notif-empty">
                <BellOff size={32} strokeWidth={1.5} color="var(--text-muted)" />
                <span className="sn-notif-empty-title">You're all caught up</span>
                <span className="sn-notif-empty-caption">New approvals, rejections and review requests will show up here.</span>
              </div>
            )}

            {!listLoading && list.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.SUBMITTED;
              return (
                <button key={n.id} type="button" className={`sn-notif-row ${n.isRead ? "" : "unread"}`} onClick={() => openRow(n)}>
                  <span className={`sn-notif-icon ${meta.cls}`}><meta.Icon size={18} /></span>
                  <span className="sn-notif-body">
                    <span className="sn-notif-message">{n.message}</span>
                    {n.entityTitle && <span className="sn-notif-entity">{n.entityTitle}</span>}
                    {n.reason && <span className="sn-notif-reason">{n.reason}</span>}
                    <span className="sn-notif-time">{relativeTime(n.sentDate)}</span>
                  </span>
                  {!n.isRead && <span className="sn-notif-dot" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
