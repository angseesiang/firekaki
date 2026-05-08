import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Flame, ShieldCheck, Clock } from "lucide-react";
import { useMe, useLogout } from "@/lib/auth";

const ROLE_BLURB: Record<string, string> = {
  admin:
    "Full oversight. You can grant or revoke rights across all user groups, and you are the only role authorised to deactivate emergencies.",
  reviewer:
    "Verifies vulnerable registrations and next-of-kin. Can activate Major emergencies. Sees all volunteer and vulnerable data.",
  volunteer:
    "Trained neighbour. You will receive alerts within a 2 km radius and can choose to accept or decline each one.",
  vulnerable:
    "Registered resident. Once a Reviewer verifies your profile, you can request help with one tap. A Minor emergency will be paged to nearby volunteers.",
};

export default function DashboardPage() {
  const me = useMe();
  const logout = useLogout();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!me.isLoading && !me.data) navigate("/login");
  }, [me.isLoading, me.data, navigate]);

  if (me.isLoading || !me.data) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <p className="text-stone-500">Loading…</p>
      </div>
    );
  }

  const u = me.data;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[hsl(var(--primary))]">
              <Flame className="w-5 h-5" />
              <span className="font-serif text-xl font-bold">Fire Kaki</span>
            </Link>
          <button
            onClick={() => logout.mutate(undefined, { onSuccess: () => navigate("/login") })}
            className="text-sm text-stone-600 hover:text-stone-900"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--primary))] mb-2">
            Signed in · {u.role}
          </p>
          <h1 className="font-serif text-4xl font-bold text-stone-900">
            Welcome, {u.name}.
          </h1>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card icon={<ShieldCheck className="w-4 h-4" />} label="Role">
            <span className="capitalize">{u.role}</span>
          </Card>
          <Card icon={<Clock className="w-4 h-4" />} label="Status">
            {u.role === "vulnerable"
              ? u.verified
                ? "Verified"
                : "Awaiting verification"
              : "Active"}
          </Card>
          <Card icon={<Flame className="w-4 h-4" />} label="Vault">
            {u.role}_users
          </Card>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-8">
          <h2 className="font-serif text-2xl font-bold text-stone-900 mb-3">
            Your role
          </h2>
          <p className="text-stone-700 leading-relaxed">{ROLE_BLURB[u.role]}</p>
          {u.role === "vulnerable" && !u.verified && (
            <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
              <strong>Awaiting Reviewer verification.</strong> A Reviewer will
              confirm your identity, residence, and next-of-kin details. Once
              verified, you'll be able to request help with one tap.
            </div>
          )}
        </div>

        <p className="text-xs text-stone-500 mt-8">
          Logged in to the <span className="font-mono">{u.role}_users</span>{" "}
          vault · Email <span className="font-mono">{u.email}</span>
        </p>
      </main>
    </div>
  );
}

function Card({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-5">
      <div className="flex items-center gap-2 text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2">
        {icon}
        {label}
      </div>
      <div className="text-stone-900 font-medium">{children}</div>
    </div>
  );
}
