import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { cx } from "./styles";
import { checkImage } from "../utils/image";

/**
 * Picker for the listing's single photo. Shows the chosen file (or the current saved photo) as a preview.
 * `file` is a newly chosen File; `currentSrc` is the saved photo's URL; `onRemoveCurrent` clears the saved one.
 */
function ImagePicker({ id, file, onChange, currentSrc, onRemoveCurrent }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const pick = (f) => {
    if (!f) return;
    const problem = checkImage(f);
    setError(problem);
    if (!problem) onChange(f);
  };

  const shown = file ? previewUrl : currentSrc;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-primary-light">Apartment photo <span className="text-grey-400 font-normal">(optional)</span></label>
      {shown ? (
        <div className="relative rounded-xl overflow-hidden border border-grey-200 bg-grey-100">
          <img src={shown} alt="Apartment photo preview" className="w-full h-48 object-cover" />
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button type="button" onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 bg-white/95 text-primary text-xs font-medium px-3 py-1.5 rounded-lg shadow hover:bg-white">
              <RefreshCw size={13} /> Replace
            </button>
            <button type="button" onClick={() => { setError(""); if (file) onChange(null); else onRemoveCurrent?.(); if (inputRef.current) inputRef.current.value = ""; }}
              className="inline-flex items-center gap-1.5 bg-white/95 text-red-600 text-xs font-medium px-3 py-1.5 rounded-lg shadow hover:bg-white">
              <Trash2 size={13} /> Remove
            </button>
          </div>
          {file && <span className="absolute top-3 left-3 bg-accent text-white text-[11px] font-semibold px-2 py-0.5 rounded-lg">New — saved with the listing</span>}
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files?.[0]); }}
          className={cx("flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors",
            error ? "border-red-300 bg-red-50/50" : dragging ? "border-accent bg-accent/5" : "border-grey-200 bg-off-white hover:border-accent/60")}>
          <ImagePlus size={26} className="text-accent" />
          <span className="text-sm font-medium text-primary">Click to add a photo <span className="text-grey-400 font-normal">or drag it here</span></span>
        </button>
      )}
      <input ref={inputRef} id={id} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only"
        onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
      {error ? <p className="text-xs text-red-500">{error}</p> : <p className="text-xs text-grey-400">JPG, PNG or WebP, up to 5 MB. Shown on the listing card and details page.</p>}
    </div>
  );
}

export default ImagePicker;
