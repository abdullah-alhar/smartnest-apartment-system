import { useState } from "react";
import { Link } from "react-router-dom";
import { apartmentImageSrc } from "../api/apartmentApi";
import { BedDouble, Ruler, MapPin, Building2 } from "lucide-react";
import { fmtPercent, fmtPrice } from "../utils/format";
import PriceBlock from "./PriceBlock";
import { Badge, Card, Skeleton } from "./ui";
import { cx } from "./styles";

/** The listing's photo, or a styled placeholder when the apartment has none. */
export function ApartmentVisual({ apartment: a, imageUrl, className = "h-48", large = false }) {
  const [failed, setFailed] = useState(false);
  const src = apartmentImageSrc(imageUrl ?? a?.imageUrl);
  if (src && !failed) {
    return (
      <div className={cx("relative overflow-hidden bg-primary", className)}>
        <img src={src} alt={a?.title ?? ""} loading="lazy" onError={() => setFailed(true)} className="absolute inset-0 w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={cx("apt-visual relative overflow-hidden", className)}>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <Building2 size={large ? 56 : 36} strokeWidth={1.25} className="text-accent-light/80 mb-2" />
        {large && <p className="font-serif text-2xl text-white/90 font-semibold">{a?.title}</p>}
        <p className={cx("uppercase tracking-[0.25em] text-white/50", large ? "text-xs mt-2" : "text-[10px]")}>
          {a?.city ?? a?.address?.city ?? "SmartNest"}
        </p>
      </div>
    </div>
  );
}

function ApartmentCard({ apartment: a, index = 0, footer }) {
  const to = `/apartments/${a.apartmentId}`;
  const promo = !!a.discountedPrice;
  const sold = a.availabilityStatus === "SOLD";

  return (
    <Card className={cx(
      "group overflow-hidden flex flex-col transition-all duration-300 hover:shadow-[var(--shadow-elevated)] hover:-translate-y-1 animate-rise",
      promo && "ring-1 ring-accent/25", sold && "opacity-75",
    )} style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}>
      <Link to={to} className="relative block" aria-label={a.title}>
        <ApartmentVisual apartment={a} className="h-44 transition-transform duration-500 group-hover:scale-[1.03]" />
        {promo && (
          <span className="absolute top-3 left-3 bg-accent text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-md tracking-wide">
            {fmtPercent(a.discountPercentage)}% OFF
          </span>
        )}
        <span className="absolute top-3 right-3"><Badge status={a.availabilityStatus} /></span>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <Link to={to} className="font-semibold text-primary text-base mb-0.5 line-clamp-1 hover:text-accent-dark">{a.title}</Link>
        <p className="text-grey-400 text-xs flex items-center gap-1 mb-3">
          <MapPin size={13} /> {[a.street, a.city].filter(Boolean).join(", ") || "Location not set"}
        </p>
        <div className="flex gap-4 text-xs text-grey-500 mb-4">
          <span className="flex items-center gap-1"><BedDouble size={14} /> {a.roomCount} room{a.roomCount === 1 ? "" : "s"}</span>
          <span className="flex items-center gap-1"><Ruler size={14} /> {Number(a.size).toLocaleString("en-US")} sqft</span>
        </div>

        <div className={cx("mt-auto pt-3 border-t flex items-end justify-between gap-3", promo ? "border-accent/20" : "border-grey-100")}>
          <PriceBlock price={a.price} discountedPrice={a.discountedPrice} discountPercentage={a.discountPercentage} size="sm" />
          {promo
            ? (
              <div className="text-right">
                <p className="text-[10px] text-grey-400 uppercase tracking-wider">You save</p>
                <p className="text-sm font-bold text-green-600">{fmtPrice(Number(a.price) - Number(a.discountedPrice))}</p>
              </div>
            )
            : <Link to={to} className="text-xs text-accent font-medium hover:underline whitespace-nowrap">View details →</Link>}
        </div>
      </div>

      {footer && <div className="px-5 pb-5 -mt-1 flex flex-wrap gap-2">{footer}</div>}
    </Card>
  );
}

export function ApartmentCardSkeleton() {
  return (
    <Card className="overflow-hidden" aria-hidden="true">
      <Skeleton className="h-44 w-full rounded-none" />
      <div className="p-5 flex flex-col gap-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-3"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-16" /></div>
        <Skeleton className="h-6 w-1/3" />
      </div>
    </Card>
  );
}

export function ApartmentGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => <ApartmentCardSkeleton key={i} />)}
    </div>
  );
}

export default ApartmentCard;
