// backend errors can come back as a string, {message}, or {error} — check all three
export function extractErrorMessage(err, fallback = "Something went wrong. Please try again.") {
  const body = err?.response?.data;
  if (typeof body === "string" && body.trim()) return body.trim();
  if (body?.message) return body.message;
  if (body?.error) return body.error;
  if (err?.message === "Network Error") return "Could not reach the server. Please check your connection.";
  return fallback;
}
