// a single shimmering placeholder block
export function SkeletonBlock({ width = "100%", height = 16, radius = 6, style }) {
  return (
    <span
      className="skeleton-block"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

// placeholder for a .promo-card while it's loading
export function SkeletonPromoCard() {
  return (
    <div className="promo-card skeleton-card">
      <div className="promo-card-header">
        <div style={{ flex: 1 }}>
          <SkeletonBlock width="70%" height={18} style={{ marginBottom: 8 }} />
          <SkeletonBlock width="40%" height={12} />
        </div>
        <SkeletonBlock width={64} height={32} radius={10} />
      </div>
      <SkeletonBlock width="100%" height={12} style={{ marginBottom: 6 }} />
      <SkeletonBlock width="85%" height={12} style={{ marginBottom: 18 }} />
      <div className="promo-card-footer">
        <SkeletonBlock width={120} height={28} radius={8} />
        <SkeletonBlock width={80} height={22} radius={999} />
      </div>
    </div>
  );
}

export function SkeletonPromoGrid({ count = 3 }) {
  return (
    <div className="grid-cards">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonPromoCard key={i} />
      ))}
    </div>
  );
}

// placeholder rows for a .data-table while it's loading
export function SkeletonTableRows({ columns = 5, rows = 4 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r}>
      {Array.from({ length: columns }).map((_, c) => (
        <td key={c}><SkeletonBlock width={c === 0 ? "80%" : "60%"} height={13} /></td>
      ))}
    </tr>
  ));
}
