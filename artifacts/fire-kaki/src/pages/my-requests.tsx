import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Flame, ArrowLeft, Siren, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { listEmergencies, type Emergency } from "@workspace/api-client-react";
import { useMe, useLogout } from "@/lib/auth";

export default function MyRequestsPage() {
  const me = useMe();
  const logout = useLogout();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (me.isLoading) return;
    if (!me.data) navigate("/login");
    else if (me.data.role !== "vulnerable") navigate("/dashboard");
  }, [me.isLoading, me.data, navigate]);

  const list = useQuery({
    queryKey: ["/api/emergencies"] as const,
    queryFn: () => listEmergencies({ credentials: "include" }),
    refetchInterval: 10_000,
  });

  if (me.isLoading || !me.data || me.data.role !== "vulnerable") {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <p className="text-stone-500">Loading…</p>
      </div>
    );
  }

  const items = list.data?.emergencies ?? [];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[hsl(var(--primary))]">
            <Flame className="w-5 h-5" />
            <span className="font-serif text-xl font-bold">Fire Kaki</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-[hsl(var(--primary))]"
            >
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
            <button
              onClick={() => logout.mutate(undefined, { onSuccess: () => navigate("/") })}
              className="text-sm text-stone-600 hover:text-stone-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="font-serif text-3xl font-bold text-stone-900">Past requests</h1>
        <p className="text-stone-600 mt-2">
          Every help request you've sent — most recent first.
        </p>

        <section className="mt-6 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          {list.isLoading ? (
            <p className="text-sm text-stone-500">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-stone-500">No requests yet.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((e) => (
                <RequestRow key={e.id} e={e} />
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function RequestRow({ e }: { e: Emergency }) {
  const statusBadge =
    e.status === "active"
      ? "bg-red-50 text-red-700 border-red-200"
      : e.status === "deactivated"
        ? "bg-stone-100 text-stone-600 border-stone-200"
        : "bg-green-50 text-green-700 border-green-200";
  return (
    <li className="border border-stone-200 rounded-xl p-4">
      <div className="flex items-center gap-2 flex-wrap">
        <Siren className="w-4 h-4 text-[hsl(var(--primary))]" />
        <span
          className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
            e.type === "major"
              ? "bg-[hsl(var(--primary))] text-white"
              : "bg-amber-100 text-amber-900"
          }`}
        >
          {e.type}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded border ${statusBadge}`}>
          {e.status}
        </span>
        <span className="text-xs text-stone-500 ml-auto">
          {new Date(e.createdAt).toLocaleString()}
        </span>
      </div>
      {e.description && <p className="text-sm text-stone-800 mt-2">{e.description}</p>}
      {e.address && <p className="text-xs text-stone-600 mt-1">{e.address}</p>}
      {e.responseStats && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
            <span className="font-semibold">{e.responseStats.accepted}</span> accepted
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 border border-green-300 text-green-900">
            <CheckCircle2 className="w-3 h-3" />
            <span className="font-semibold">{e.responseStats.arrived}</span> arrived
          </span>
        </div>
      )}
    </li>
  );
}
