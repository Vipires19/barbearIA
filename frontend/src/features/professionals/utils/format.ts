const DAY_LABELS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function formatWorkDays(days: number[]): string {
  if (!days.length) return "Sem dias definidos";
  return days
    .sort((a, b) => a - b)
    .map((d) => DAY_LABELS[d] ?? String(d))
    .join(", ");
}

export function formatAvailability(start: string, end: string): string {
  return `${start} – ${end}`;
}

export function resolveAvatarUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  return `${base}${url}`;
}

export { DAY_LABELS };
