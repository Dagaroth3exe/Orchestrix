export function formatRelative(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function parseDay(raw: string): Date | null {
  if (!raw) return null;
  const d = new Date(raw.length <= 10 ? raw + "T00:00:00" : raw);
  return isNaN(d.getTime()) ? null : d;
}

/** Days from today until the given YYYY-MM-DD date (negative = overdue). */
export function daysUntil(raw: string): number | null {
  const d = parseDay(raw);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function formatDue(raw: string): string {
  const d = parseDay(raw);
  if (!d) return "No due date";
  const n = daysUntil(raw)!;
  if (n === 0) return "Due today";
  if (n === 1) return "Due tomorrow";
  if (n === -1) return "Due yesterday";
  if (n < 0) return `${Math.abs(n)} days overdue`;
  if (n < 7) return `Due ${d.toLocaleDateString("en-US", { weekday: "long" })}`;
  return `Due ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
