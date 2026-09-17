// backend LocalDateTime/LocalDate strings carry no offset — parse them as local time, never UTC
function parseLocal(value) {
  if (!value) return null;
  const [datePart, timePart = "00:00:00"] = String(value).split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh = 0, mm = 0, ss = 0] = timePart.split(":").map((v) => parseFloat(v));
  return new Date(y, m - 1, d, hh, mm, Math.floor(ss));
}

export function relativeTime(value) {
  const date = parseLocal(value);
  if (!date) return "";
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

// true once a LocalDate has arrived (today counts)
export function hasStarted(startDate) {
  const start = parseLocal(startDate);
  return !start || start <= new Date();
}

export function endsLabel(endDate) {
  const end = parseLocal(endDate);
  if (!end) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((end - today) / 86400000);
  if (days < 0) return "Ended";
  if (days === 0) return "Ends today";
  return days === 1 ? "Ends tomorrow" : `Ends in ${days} days`;
}

export function isSameMonth(value, ref = new Date()) {
  const date = parseLocal(value);
  return !!date && date.getFullYear() === ref.getFullYear() && date.getMonth() === ref.getMonth();
}
