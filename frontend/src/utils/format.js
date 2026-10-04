export const fmtPrice = (p) => `LKR ${Number(p).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export const fmtPercent = (p) => `${+Number(p).toFixed(1)}`;

export const fmtDate = (value) => {
  if (!value) return "";
  const [y, m, d] = String(value).split("T")[0].split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export const availabilityLabel = (status) =>
  status === "AVAILABLE" ? "Available" : status === "RESERVED" ? "Reserved" : "Sold";

export const locationLabel = (a) => [a?.city ?? a?.address?.city].filter(Boolean).join(", ");

export const fmtCompactPrice = (n) => {
  const v = Number(n);
  if (v >= 1_000_000_000) return `LKR ${+(v / 1_000_000_000).toFixed(2)}B`;
  if (v >= 1_000_000) return `LKR ${+(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `LKR ${Math.round(v / 1_000)}K`;
  return `LKR ${v}`;
};

// Same preset ranges as the Figma design's price filter.
export const PRICE_RANGES = [
  { label: "Any Price", min: "", max: "" },
  { label: "Under LKR 30M", min: "", max: "30000000" },
  { label: "LKR 30M – 60M", min: "30000000", max: "60000000" },
  { label: "LKR 60M – 100M", min: "60000000", max: "100000000" },
  { label: "Above LKR 100M", min: "100000000", max: "" },
];
