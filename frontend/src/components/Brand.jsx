import { Building2 } from "lucide-react";

// showText=false renders icon-only, for the collapsed sidebar rail
function Brand({ size = "md", showText = true }) {
  const dims = size === "lg" ? 44 : 34;
  const iconSize = size === "lg" ? 24 : 18;
  const textClass = size === "lg" ? "brand-text brand-text-lg" : "brand-text";

  return (
    <span className="brand">
      <span className="brand-icon" style={{ width: dims, height: dims }}>
        <Building2 size={iconSize} strokeWidth={2.25} />
      </span>
      {showText && <span className={textClass}>SmartNest</span>}
    </span>
  );
}

export default Brand;
