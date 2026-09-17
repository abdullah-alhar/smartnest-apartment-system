import { House } from "lucide-react";

function Brand({ size = "md" }) {
  const dims = size === "lg" ? 40 : 28;
  const iconSize = size === "lg" ? 22 : 16;
  const textClass = size === "lg" ? "brand-text brand-text-lg" : "brand-text";

  return (
    <span className="brand">
      <span className="brand-icon" style={{ width: dims, height: dims }}>
        <House size={iconSize} strokeWidth={2} />
      </span>
      <span className={textClass}>SmartNest</span>
    </span>
  );
}

export default Brand;
