import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui";
import { cx } from "./styles";

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = [];
  for (let p = 0; p < totalPages; p++) {
    if (p === 0 || p === totalPages - 1 || Math.abs(p - page) <= 1) pages.push(p);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }

  return (
    <nav className="flex items-center justify-center gap-3 mt-10" aria-label="Pagination">
      <Button variant="secondary" size="sm" icon={ChevronLeft} disabled={page === 0} onClick={() => onChange(page - 1)}>Previous</Button>
      <div className="flex items-center gap-1">
        {pages.map((p, i) => p === "…"
          ? <span key={`gap-${i}`} className="px-2 text-grey-400">…</span>
          : (
            <button key={p} type="button" aria-current={p === page ? "page" : undefined} onClick={() => onChange(p)}
              className={cx("w-9 h-9 rounded-xl text-sm font-medium transition-colors",
                p === page ? "bg-primary text-white" : "text-grey-500 hover:bg-white hover:text-primary")}>
              {p + 1}
            </button>
          ))}
      </div>
      <Button variant="secondary" size="sm" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        Next <ChevronRight size={15} />
      </Button>
    </nav>
  );
}

export default Pagination;
