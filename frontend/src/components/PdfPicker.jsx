import { useRef, useState } from "react";
import { FileText, UploadCloud, X } from "lucide-react";
import { cx } from "./styles";
import { checkPdf } from "../utils/pdf";

const fmtSize = (bytes) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

/** Drop zone / picker for the bank-transfer PDF used as payment proof. */
function PdfPicker({ id, label = "Payment proof (PDF)", file, onChange, error, hint = "Upload the bank transfer slip or payment receipt — PDF, up to 5 MB." }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [localError, setLocalError] = useState("");

  const pick = (f) => {
    if (!f) return;
    const problem = checkPdf(f);
    setLocalError(problem);
    onChange(problem ? null : f);
  };

  const shownError = localError || error;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-primary-light">{label}</label>
      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <span className="w-10 h-10 rounded-xl bg-white text-green-600 flex items-center justify-center flex-shrink-0"><FileText size={20} /></span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-primary truncate">{file.name}</p>
            <p className="text-xs text-grey-500">{fmtSize(file.size)} · ready to upload</p>
          </div>
          <button type="button" aria-label="Remove file" onClick={() => { onChange(null); setLocalError(""); if (inputRef.current) inputRef.current.value = ""; }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-grey-400 hover:text-red-500 hover:bg-white">
            <X size={16} />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
          className={cx("flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
            shownError ? "border-red-300 bg-red-50/50" : dragging ? "border-accent bg-accent/5" : "border-grey-200 bg-off-white hover:border-accent/60")}>
          <UploadCloud size={24} className="text-accent" />
          <span className="text-sm font-medium text-primary">Click to choose a PDF <span className="text-grey-400 font-normal">or drag it here</span></span>
        </button>
      )}
      <input ref={inputRef} id={id} type="file" accept="application/pdf,.pdf" className="sr-only"
        onChange={(e) => pick(e.target.files?.[0])} />
      {shownError
        ? <p className="text-xs text-red-500">{shownError}</p>
        : <p className="text-xs text-grey-400">{hint}</p>}
    </div>
  );
}

export default PdfPicker;
