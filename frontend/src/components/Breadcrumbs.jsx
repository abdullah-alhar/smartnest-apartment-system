import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";

function Breadcrumbs({ items, light = false }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className={`flex flex-wrap items-center gap-1.5 text-sm ${light ? "text-white/50" : "text-grey-400"}`}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {last || !item.to
                ? <span aria-current={last ? "page" : undefined} className={light ? "text-white" : "text-primary"}>{item.label}</span>
                : <Link to={item.to} className={light ? "hover:text-white" : "hover:text-primary"}>{item.label}</Link>}
              {!last && <ChevronRight size={14} aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
