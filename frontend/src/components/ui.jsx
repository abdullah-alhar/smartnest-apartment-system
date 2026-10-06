import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Loader2, X, AlertCircle } from "lucide-react";
import { cx, fieldCls, statusLabel } from "./styles";

/* ── Button ─────────────────────────────────────────────────────────────── */

const VARIANTS = {
  primary:   "bg-primary text-white hover:bg-primary-light shadow-sm",
  accent:      "bg-accent text-white hover:bg-accent-dark shadow-sm",
  secondary: "bg-white text-primary border border-grey-200 hover:border-primary hover:bg-off-white shadow-sm",
  ghost:     "text-primary hover:bg-grey-100",
  danger:    "bg-red-600 text-white hover:bg-red-700 shadow-sm",
  success:   "bg-green-600 text-white hover:bg-green-700 shadow-sm",
  "danger-ghost": "text-red-600 hover:bg-red-50",
  "outline-light": "border border-white/30 text-white hover:bg-white/10",
};

const SIZES = {
  xs: "h-7 px-2.5 text-xs gap-1",
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
};

export function Button({
  variant = "primary", size = "md", loading = false, icon: Icon, fullWidth, to, state,
  className = "", children, disabled, type = "button", ...rest
}) {
  const cls = cx(
    "inline-flex items-center justify-center font-medium rounded-xl whitespace-nowrap select-none",
    "transition-all duration-150 active:scale-[0.98]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
    VARIANTS[variant], SIZES[size], fullWidth && "w-full", className,
  );
  const content = (
    <>
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={size === "lg" ? 18 : 15} /> : null}
      {children}
    </>
  );
  if (to) return <Link to={to} state={state} className={cls} {...rest}>{content}</Link>;
  return <button type={type} disabled={disabled || loading} className={cls} {...rest}>{content}</button>;
}

/* ── Status badge ───────────────────────────────────────────────────────── */

const TONES = {
  green:  { bg: "bg-green-100",   text: "text-green-700",   dot: "bg-green-500" },
  emerald:{ bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  amber:  { bg: "bg-amber-100",   text: "text-amber-700",   dot: "bg-amber-500" },
  blue:   { bg: "bg-blue-100",    text: "text-blue-700",    dot: "bg-blue-500" },
  purple: { bg: "bg-purple-100",  text: "text-purple-700",  dot: "bg-purple-500" },
  red:    { bg: "bg-red-100",     text: "text-red-600",     dot: "bg-red-500" },
  grey:   { bg: "bg-gray-100",    text: "text-gray-500",    dot: "bg-gray-400" },
  accent:   { bg: "bg-accent/15",     text: "text-accent-dark",   dot: "bg-accent" },
};

const STATUS_TONE = {
  AVAILABLE: "green", RESERVED: "amber", SOLD: "grey",
  PENDING: "amber", APPROVED: "green", REJECTED: "red", CANCELLED: "red",
  NEW: "blue", IN_PROGRESS: "purple", RESPONDED: "emerald", CLOSED: "grey",
  RESCHEDULED: "purple", DECLINED: "red", COMPLETED: "emerald",
  ACTIVE: "green", INACTIVE: "grey", EXPIRED: "grey", FEATURED: "accent",
};

export function Badge({ status, label, tone, showDot = true, size = "sm", className = "" }) {
  const key = String(status ?? "").toUpperCase();
  const t = TONES[tone ?? STATUS_TONE[key]] ?? TONES.grey;
  return (
    <span className={cx(
      "inline-flex items-center gap-1.5 font-medium rounded-full whitespace-nowrap",
      size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
      t.bg, t.text, className,
    )}>
      {showDot && <span className={cx("w-1.5 h-1.5 rounded-full flex-shrink-0", t.dot)} />}
      {label ?? statusLabel(key)}
    </span>
  );
}

/* ── Surfaces ───────────────────────────────────────────────────────────── */

export function Card({ className = "", children, ...rest }) {
  return <div className={cx("bg-white rounded-2xl shadow-[var(--shadow-card)]", className)} {...rest}>{children}</div>;
}

export function Alert({ tone = "error", children, action, className = "" }) {
  const styles = {
    error: "bg-red-50 border-red-200 text-red-700",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
  };
  return (
    <div role={tone === "error" ? "alert" : undefined} className={cx("flex items-start gap-3 rounded-xl border px-4 py-3 text-sm", styles[tone], className)}>
      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1">{children}</div>
      {action}
    </div>
  );
}

export function Spinner({ className = "" }) {
  return <div className={cx("flex justify-center py-16", className)}><Loader2 size={28} className="animate-spin text-accent" /></div>;
}

export function Skeleton({ className = "", style }) {
  return <span className={cx("skeleton", className)} style={style} />;
}

/* ── Page headings ──────────────────────────────────────────────────────── */

/** Primary-colour banner used at the top of customer-facing pages. */
export function PublicHero({ eyebrow, title, subtitle, children, actions }) {
  return (
    <div className="bg-primary">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            {eyebrow && (
              <span className="inline-flex items-center gap-2 text-accent-light text-xs font-medium tracking-widest uppercase mb-3">
                <span className="w-5 h-px bg-accent-light" /> {eyebrow}
              </span>
            )}
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-1">{title}</h1>
            {subtitle && <p className="text-white/50 text-sm max-w-2xl">{subtitle}</p>}
          </div>
          {actions && <div className="flex gap-3 flex-wrap">{actions}</div>}
        </div>
        {children}
      </div>
      <div className="h-8 bg-gradient-to-b from-primary to-off-white" />
    </div>
  );
}

/** Plain heading used inside the staff portal. */
export function PageHeader({ title, subtitle, actions, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary">{title}</h1>
        {subtitle && <p className="text-sm text-grey-400 mt-0.5">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, action, className = "" }) {
  return (
    <div className={cx("flex items-end justify-between gap-4 mb-6", className)}>
      <div>
        {eyebrow && <span className="text-accent text-xs uppercase tracking-widest font-medium">{eyebrow}</span>}
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-primary mt-1">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/** Pill-style segmented filter (All / Pending / Approved …). */
export function FilterTabs({ options, value, onChange, counts }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: statusLabel(o) } : o;
        const active = value === opt.value;
        return (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className={cx(
              "px-3 py-1.5 rounded-xl text-xs font-medium transition-colors",
              active ? "bg-primary text-white" : "bg-white text-grey-500 hover:text-primary border border-grey-200",
            )}>
            {opt.label}
            {counts?.[opt.value] != null && <span className="ml-1.5 opacity-60">{counts[opt.value]}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ── Form fields ────────────────────────────────────────────────────────── */

export function Field({ label, htmlFor, error, hint, children, className = "" }) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      {label && <label htmlFor={htmlFor} className="text-sm font-medium text-primary-light">{label}</label>}
      {children}
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} />{error}</p>}
      {hint && !error && <p className="text-xs text-grey-400">{hint}</p>}
    </div>
  );
}

function withIcon(Icon, control, top = false) {
  if (!Icon) return control;
  return (
    <div className="relative">
      <Icon size={16} className={cx("absolute left-3.5 text-grey-400 pointer-events-none", top ? "top-3" : "top-1/2 -translate-y-1/2")} />
      {control}
    </div>
  );
}

export function Input({ label, error, hint, icon, id, className = "", ...rest }) {
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      {withIcon(icon, <input id={id} className={fieldCls(error, cx(icon && "pl-10", className))} {...rest} />)}
    </Field>
  );
}

export function Select({ label, error, hint, icon, id, className = "", children, ...rest }) {
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      {withIcon(icon, <select id={id} className={fieldCls(error, cx("cursor-pointer", icon && "pl-10", className))} {...rest}>{children}</select>)}
    </Field>
  );
}

export function Textarea({ label, error, hint, icon, id, className = "", ...rest }) {
  return (
    <Field label={label} htmlFor={id} error={error} hint={hint}>
      {withIcon(icon, <textarea id={id} className={fieldCls(error, cx("min-h-[100px] resize-y", icon && "pl-10", className))} {...rest} />, true)}
    </Field>
  );
}

/* ── Modal ──────────────────────────────────────────────────────────────── */

const MODAL_SIZES = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };

export function Modal({ open = true, onClose, title, description, icon: Icon, size = "md", footer, children, dismissable = true }) {
  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape" && dismissable) onClose?.(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open, onClose, dismissable]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget && dismissable) onClose?.(); }}>
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm pointer-events-none" />
      <div role="dialog" aria-modal="true"
        className={cx("relative w-full bg-white rounded-2xl shadow-[var(--shadow-modal)] flex flex-col max-h-[90vh] animate-fade-in", MODAL_SIZES[size])}>
        {title && (
          <div className="flex items-start justify-between gap-4 px-6 py-5 border-b border-grey-100">
            <div className="flex items-start gap-3">
              {Icon && <span className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center flex-shrink-0"><Icon size={18} /></span>}
              <div>
                <h2 className="text-lg font-semibold text-primary">{title}</h2>
                {description && <p className="text-sm text-grey-400 mt-0.5">{description}</p>}
              </div>
            </div>
            {dismissable && (
              <button type="button" onClick={onClose} aria-label="Close"
                className="w-8 h-8 rounded-lg flex items-center justify-center text-grey-400 hover:text-primary hover:bg-grey-100 flex-shrink-0">
                <X size={18} />
              </button>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-grey-100 flex flex-wrap justify-end gap-3 bg-grey-50 rounded-b-2xl">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/* ── Data table ─────────────────────────────────────────────────────────── */

export function Table({ head, children }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-grey-100 bg-grey-50/60">
              {head.map((h) => (
                <th key={h.label ?? h} className={cx("px-5 py-3 text-left text-xs font-semibold text-grey-400 uppercase tracking-wider whitespace-nowrap", h.right && "text-right")}>
                  {h.label ?? h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-grey-100">{children}</tbody>
        </table>
      </div>
    </Card>
  );
}

