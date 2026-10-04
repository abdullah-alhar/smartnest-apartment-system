import { fmtPercent, fmtPrice } from "../utils/format";
import { cx } from "./styles";

const SIZE = {
  sm: { now: "text-lg", old: "text-xs" },
  md: { now: "text-xl", old: "text-sm" },
  lg: { now: "text-3xl", old: "text-sm" },
};

function PriceBlock({ price, discountedPrice, discountPercentage, size = "md", light = false }) {
  const s = SIZE[size] ?? SIZE.md;
  if (!discountedPrice) {
    return <p className={cx("font-bold leading-tight", s.now, light ? "text-white" : "text-primary")}>{fmtPrice(price)}</p>;
  }
  return (
    <div>
      <p className={cx("line-through leading-none mb-1", s.old, light ? "text-white/50" : "text-grey-400")}>{fmtPrice(price)}</p>
      <div className="flex items-center gap-2 flex-wrap">
        <p className={cx("font-black text-accent leading-tight", s.now)}>{fmtPrice(discountedPrice)}</p>
        <span className="bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{fmtPercent(discountPercentage)}% OFF</span>
      </div>
    </div>
  );
}

export default PriceBlock;
