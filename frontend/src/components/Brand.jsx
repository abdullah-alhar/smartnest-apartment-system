import { House } from "lucide-react";

function Brand({ light = false, subtitle = "Lanka Urban Residencies" }) {
  return (
    <span className="flex items-center gap-2.5 flex-shrink-0">
      <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-white flex-shrink-0">
        <House size={16} strokeWidth={2.25} />
      </span>
      <span className="leading-tight">
        <span className={`block text-sm font-bold tracking-tight ${light ? "text-white" : "text-primary"}`}>SmartNest</span>
        {subtitle && (
          <span className={`block text-[9px] tracking-widest uppercase font-medium whitespace-nowrap ${light ? "text-white/60" : "text-grey-400"}`}>
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );
}

export default Brand;
