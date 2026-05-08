import { Link } from "wouter";
import { Flame, Search } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

export interface SectionDef<K extends string = string> {
  key: K;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

interface DashShellProps<K extends string> {
  brand: string;
  sections: SectionDef<K>[];
  active: K;
  onSectionChange: (k: K) => void;
  search: string;
  onSearchChange: (s: string) => void;
  onSignOut: () => void;
  children: ReactNode;
  showSearch?: boolean;
}

export function DashShell<K extends string>({
  brand,
  sections,
  active,
  onSectionChange,
  search,
  onSearchChange,
  onSignOut,
  children,
  showSearch = true,
}: DashShellProps<K>) {
  return (
    <div className="min-h-screen bg-stone-100 flex">
      <aside className="w-60 bg-white border-r border-stone-200 flex flex-col shrink-0">
        <div className="px-6 py-5 flex items-center gap-2 border-b border-stone-100">
          <Flame className="w-5 h-5 text-[hsl(var(--primary))]" />
          <span className="font-serif text-lg font-bold text-stone-900">{brand}</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {sections.map((s) => {
            const Icon = s.icon;
            const isActive = s.key === active;
            return (
              <button
                key={s.key}
                onClick={() => onSectionChange(s.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]"
                    : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                {s.label}
              </button>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-stone-100 space-y-1">
          <Link
            href="/"
            className="block px-3 py-1.5 text-xs text-stone-500 hover:text-stone-900"
          >
            Back to home
          </Link>
          <button
            onClick={onSignOut}
            className="block w-full text-left px-3 py-1.5 text-xs text-stone-500 hover:text-stone-900"
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-stone-200 px-8 py-4 flex items-center justify-end">
          {showSearch && (
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                placeholder="Search residents..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-lg w-72 focus:outline-none focus:bg-white focus:border-stone-300"
              />
            </div>
          )}
        </header>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({
  value,
  label,
  tone = "default",
}: {
  value: string;
  label: string;
  tone?: "default" | "danger" | "success";
}) {
  const cardClass =
    tone === "danger"
      ? "bg-[hsl(var(--primary))] text-white border-transparent"
      : "bg-white border-stone-200";
  const valueClass =
    tone === "danger"
      ? "text-white"
      : tone === "success"
      ? "text-green-600"
      : "text-stone-900";
  const labelClass = tone === "danger" ? "text-white/90" : "text-stone-600";
  return (
    <div className={`rounded-2xl border p-6 shadow-sm relative overflow-hidden ${cardClass}`}>
      <div className={`text-4xl font-bold ${valueClass}`}>{value}</div>
      <div className={`mt-2 text-sm font-medium ${labelClass}`}>{label}</div>
    </div>
  );
}

export type StatusKind =
  | "pending"
  | "live-minor"
  | "live-major"
  | "verified"
  | "disabled"
  | "email-unverified"
  | "deactivated"
  | "resolved";

const STATUS_STYLES: Record<StatusKind, string> = {
  pending: "bg-amber-100 text-amber-800",
  "live-minor": "bg-[hsl(var(--primary))] text-white",
  "live-major": "bg-red-700 text-white",
  verified: "bg-green-100 text-green-800",
  disabled: "bg-stone-200 text-stone-700",
  "email-unverified": "bg-orange-100 text-orange-800",
  deactivated: "bg-stone-200 text-stone-600",
  resolved: "bg-blue-100 text-blue-800",
};

const STATUS_LABEL: Record<StatusKind, string> = {
  pending: "Pending",
  "live-minor": "Live · Minor",
  "live-major": "Live · Major",
  verified: "Verified",
  disabled: "Disabled",
  "email-unverified": "Email unverified",
  deactivated: "Deactivated",
  resolved: "Resolved",
};

export function StatusBadge({ kind, label }: { kind: StatusKind; label?: string }) {
  return (
    <span
      className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded ${STATUS_STYLES[kind]}`}
    >
      {label ?? STATUS_LABEL[kind]}
    </span>
  );
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-xl font-bold text-stone-900">{title}</h2>
        {subtitle && <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
