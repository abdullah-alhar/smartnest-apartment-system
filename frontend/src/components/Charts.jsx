export function DonutChart({ data, centerLabel = "total" }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  let acc = 0;
  const stops = total === 0
    ? "var(--color-grey-200) 0 100%"
    : data.map((d) => {
      const from = (acc / total) * 100;
      acc += d.value;
      return `${d.color} ${from}% ${(acc / total) * 100}%`;
    }).join(", ");

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <div className="relative w-36 h-36 rounded-full flex-shrink-0" style={{ background: `conic-gradient(${stops})` }} role="img"
        aria-label={data.map((d) => `${d.label}: ${d.value}`).join(", ")}>
        <div className="absolute inset-4 rounded-full bg-white flex flex-col items-center justify-center">
          <strong className="text-2xl font-bold text-primary">{total}</strong>
          <span className="text-xs text-grey-400">{centerLabel}</span>
        </div>
      </div>
      <ul className="flex flex-col gap-2.5 flex-1 min-w-[140px]">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2.5 text-sm text-grey-600">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
            {d.label}
            <b className="ml-auto text-primary">{d.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarChart({ data }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex flex-col gap-4">
      {data.map((d) => (
        <div key={d.label}>
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-grey-500">{d.label}</span>
            <span className="font-semibold text-primary">{d.value}</span>
          </div>
          <div className="h-2.5 rounded-full bg-grey-100 overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(d.value / max) * 100}%`, background: d.color, minWidth: d.value > 0 ? 8 : 0 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
