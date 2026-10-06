import { Card, Skeleton } from "./ui";
import { tdCls } from "./styles";

export function SkeletonBlock({ width = "100%", height = 16, radius = 6, style, className = "" }) {
  return <Skeleton className={className} style={{ width, height, borderRadius: radius, ...style }} />;
}

export function SkeletonPromoCard() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-5 flex flex-col gap-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-8 w-1/3" />
      </div>
    </Card>
  );
}

export function SkeletonPromoGrid({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => <SkeletonPromoCard key={i} />)}
    </div>
  );
}

export function SkeletonTableRows({ columns = 5, rows = 4 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <tr key={r}>
      {Array.from({ length: columns }).map((_, c) => (
        <td key={c} className={tdCls}><SkeletonBlock width={c === 0 ? "80%" : "60%"} height={13} /></td>
      ))}
    </tr>
  ));
}

export function SkeletonList({ rows = 3, height = 56 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => <SkeletonBlock key={i} height={height} radius={12} />)}
    </div>
  );
}
