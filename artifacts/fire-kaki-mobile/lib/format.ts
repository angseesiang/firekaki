export function formatDistance(m: number | null | undefined): string {
  if (m == null || !Number.isFinite(m)) return "—";
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export function formatEta(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}h ${mm}m`;
}

export function timeAgo(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = input instanceof Date ? input : new Date(input);
  const diff = Date.now() - d.getTime();
  if (diff < 0) return "just now";
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export function formatDate(input: string | Date | null | undefined): string {
  if (!input) return "—";
  const d = input instanceof Date ? input : new Date(input);
  return d.toLocaleString();
}

export function roleLabel(role: string): string {
  switch (role) {
    case "admin": return "Admin";
    case "reviewer": return "Reviewer";
    case "volunteer": return "Volunteer";
    case "vulnerable": return "Resident";
    case "nok": return "Next of kin";
    default: return role;
  }
}
