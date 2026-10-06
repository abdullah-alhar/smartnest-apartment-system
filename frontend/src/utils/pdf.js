export const MAX_PROOF_BYTES = 5 * 1024 * 1024;

/** Returns an error message, or "" when the file is an acceptable payment-proof PDF. */
export function checkPdf(file) {
  if (!file) return "Please attach your payment transfer slip as a PDF.";
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Only PDF files are accepted.";
  if (file.size > MAX_PROOF_BYTES) return "The PDF must be 5 MB or smaller.";
  return "";
}
