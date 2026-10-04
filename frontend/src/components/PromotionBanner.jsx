import { useEffect, useState } from "react";
import { Tag, Timer } from "lucide-react";
import { fmtDate, fmtPercent } from "../utils/format";

function remaining(endDate) {
  const [y, m, d] = String(endDate).split("-").map(Number);
  const end = new Date(y, m - 1, d, 23, 59, 59);
  const ms = end - Date.now();
  if (ms <= 0) return null;
  const s = Math.floor(ms / 1000);
  return { days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}

function Countdown({ endDate }) {
  const [left, setLeft] = useState(() => remaining(endDate));
  useEffect(() => {
    const timer = setInterval(() => setLeft(remaining(endDate)), 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (!left) return <p className="text-sm text-white/60">This offer has ended</p>;
  const cells = [["days", left.days], ["hrs", left.hours], ["min", left.minutes], ["sec", left.seconds]];
  return (
    <div className="grid grid-cols-4 gap-2" aria-label="Time left on this offer">
      {cells.map(([label, value]) => (
        <div key={label} className="bg-white/10 rounded-xl py-2 text-center">
          <strong className="block text-lg font-bold text-white tabular-nums">{String(value).padStart(2, "0")}</strong>
          <span className="text-[10px] uppercase tracking-wider text-white/50">{label}</span>
        </div>
      ))}
    </div>
  );
}

function PromotionBanner({ promotion }) {
  return (
    <div className="bg-primary rounded-2xl p-5 text-white">
      <div className="flex items-start gap-3 mb-3">
        <span className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center flex-shrink-0"><Tag size={16} /></span>
        <div>
          <p className="text-accent-light text-xs font-medium uppercase tracking-wider">Limited offer</p>
          <p className="font-semibold">{promotion.title}</p>
          <p className="text-xs text-white/50">{fmtPercent(promotion.discountPercentage)}% off · ends {fmtDate(promotion.endDate)}</p>
        </div>
      </div>
      {promotion.discountDetails && <p className="text-sm text-white/70 mb-4 leading-relaxed">{promotion.discountDetails}</p>}
      <p className="flex items-center gap-1.5 text-xs text-white/50 mb-2"><Timer size={13} /> Offer ends in</p>
      <Countdown endDate={promotion.endDate} />
    </div>
  );
}

export default PromotionBanner;
