import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, BellOff, CircleCheck, CircleX, Clock, CalendarPlus, CalendarClock, MessageCircle, Ban } from "lucide-react";
import {
  getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead, ENTITY_ROUTES,
} from "../api/notificationApi";
import { useToast } from "../context/ToastContext";
import { relativeTime } from "../utils/time";
import { SkeletonBlock } from "./Skeleton";
import { cx } from "./styles";

const POLL_MS = 30000;

export const NOTIFICATIONS_CHANGED = "sn:notifications-changed";
const announceChange = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));

const TYPE_META = {
  APPROVED:    { Icon: CircleCheck,   cls: "bg-green-100 text-green-600" },
  REJECTED:    { Icon: CircleX,       cls: "bg-red-100 text-red-500" },
  SUBMITTED:   { Icon: Clock,         cls: "bg-amber-100 text-amber-600" },
  REQUESTED:   { Icon: CalendarPlus,  cls: "bg-amber-100 text-amber-600" },
  RESPONDED:   { Icon: MessageCircle, cls: "bg-blue-100 text-blue-600" },
  RESCHEDULED: { Icon: CalendarClock, cls: "bg-purple-100 text-purple-600" },
  COMPLETED:   { Icon: CircleCheck,   cls: "bg-emerald-100 text-emerald-600" },
  CANCELLED:   { Icon: Ban,           cls: "bg-grey-100 text-grey-500" },
};

function NotificationBell({ light = false }) {
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
    window.addEventListener(NOTIFICATIONS_CHANGED, refreshCount);
    return () => {
      clearInterval(poll);
      window.removeEventListener("focus", refreshCount);
      window.removeEventListener(NOTIFICATIONS_CHANGED, refreshCount);
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
    <div className="relative" ref={ref}>
      <button type="button" title="Notifications" aria-label="Notifications" aria-expanded={open} onClick={togglePanel}
        className={cx("relative w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
          light ? "text-white hover:bg-white/10" : "text-grey-500 hover:bg-grey-100")}>
        <Bell size={19} strokeWidth={1.75} />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 rounded-full bg-accent text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div role="dialog" aria-label="Notifications"
          className="absolute right-0 top-full mt-2 w-[min(360px,calc(100vw-2rem))] bg-white rounded-2xl shadow-[var(--shadow-elevated)] border border-grey-100 overflow-hidden z-50 animate-fade-in">
          <div className="px-4 py-3 border-b border-grey-100 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-primary">Notifications</p>
              <p className="text-xs text-grey-400">{unread > 0 ? `${unread} unread` : "No unread notifications"}</p>
            </div>
            <button type="button" disabled={unread === 0} onClick={markAll}
              className="text-xs text-accent font-medium hover:underline disabled:text-grey-300 disabled:no-underline">
              Mark all read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {listLoading && (
              <div className="p-4 flex flex-col gap-3">{[1, 2, 3].map((k) => <SkeletonBlock key={k} height={44} radius={10} />)}</div>
            )}

            {!listLoading && list.length === 0 && (
              <div className="flex flex-col items-center text-center px-6 py-10">
                <BellOff size={30} strokeWidth={1.5} className="text-grey-300 mb-2" />
                <p className="text-sm font-semibold text-primary">You're all caught up</p>
                <p className="text-xs text-grey-400 mt-1">Approvals, replies and review requests will show up here.</p>
              </div>
            )}

            {!listLoading && list.map((n) => {
              const meta = TYPE_META[n.type] ?? TYPE_META.SUBMITTED;
              return (
                <button key={n.id} type="button" onClick={() => openRow(n)}
                  className={cx("w-full text-left px-4 py-3.5 flex gap-3 hover:bg-off-white border-b border-grey-50 last:border-0",
                    !n.isRead && "bg-blue-50/40")}>
                  <span className={cx("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", meta.cls)}><meta.Icon size={16} /></span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-primary leading-snug">{n.message}</span>
                    {n.entityTitle && <span className="block text-xs font-medium text-grey-500 mt-0.5 truncate">{n.entityTitle}</span>}
                    {n.reason && <span className="block text-xs text-red-500 mt-0.5">{n.reason}</span>}
                    <span className="block text-xs text-grey-400 mt-1">{relativeTime(n.sentDate)}</span>
                  </span>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-accent mt-2 flex-shrink-0" />}
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
