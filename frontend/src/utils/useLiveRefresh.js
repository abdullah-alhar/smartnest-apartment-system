import { useEffect } from "react";

const REFRESH_MS = 30000;

/** Re-run `load` when the tab regains focus and every 30s, so other people's changes show up without a page refresh. */
export function useLiveRefresh(load) {
  useEffect(() => {
    const timer = setInterval(load, REFRESH_MS);
    window.addEventListener("focus", load);
    return () => { clearInterval(timer); window.removeEventListener("focus", load); };
  }, [load]);
}
