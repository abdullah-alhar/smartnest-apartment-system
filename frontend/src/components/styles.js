// Class-name helpers shared by the UI primitives and pages.

export const cx = (...parts) => parts.filter(Boolean).join(" ");

export const statusLabel = (status) =>
  String(status ?? "").replace(/_/g, " ").toLowerCase().replace(/(^|\s)\w/g, (c) => c.toUpperCase());

export const fieldCls = (error, extra = "") => cx(
  "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-primary placeholder:text-grey-400 transition-all",
  "focus:ring-2 focus:ring-accent/30 focus:border-accent disabled:opacity-60 disabled:bg-grey-50 disabled:cursor-not-allowed",
  error ? "border-red-400 focus:border-red-400 focus:ring-red-200" : "border-grey-200",
  extra,
);

export const tdCls = "px-5 py-3.5 align-middle";
