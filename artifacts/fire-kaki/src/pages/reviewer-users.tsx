import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Flame, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  reviewerListUsers,
  verifyVolunteer,
  verifyVulnerable,
} from "@workspace/api-client-react";
import { useMe, useLogout } from "@/lib/auth";

const KEY = ["/api/reviewer/users-overview"] as const;

type Tab = "volunteer" | "vulnerable";

export default function ReviewerUsersPage() {
  const me = useMe();
  const logout = useLogout();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (me.isLoading) return;
    if (!me.data) navigate("/login");
    else if (me.data.role !== "reviewer" && me.data.role !== "admin") {
      navigate("/dashboard");
    }
  }, [me.isLoading, me.data, navigate]);

  const role = me.data?.role;
  if (me.isLoading || !me.data || (role !== "reviewer" && role !== "admin")) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <p className="text-stone-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
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
              Dashboard
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

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--primary))] mb-2">
            Reviewer · User management
          </p>
          <h1 className="font-serif text-4xl font-bold text-stone-900">Manage users</h1>
          <p className="text-stone-600 mt-3">
            Read-only roster of every Volunteer and Vulnerable resident. Tap{" "}
            <strong>Verify</strong> to vouch for an account once you've checked their details.
            Disable / delete remain Admin-only.
          </p>
        </div>

        <UserVaults />
      </main>
    </div>
  );
}

function UserVaults() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("vulnerable");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const list = useQuery({
    queryKey: KEY,
    queryFn: () => reviewerListUsers({ credentials: "include" }),
  });

  const verifyVol = useMutation({
    mutationFn: (id: number) => verifyVolunteer(id, { credentials: "include" }),
    onSuccess: () => {
      setMsg({ kind: "ok", text: "Volunteer verified." });
      qc.invalidateQueries({ queryKey: KEY });
    },
    onError: (err) =>
      setMsg({
        kind: "err",
        text:
          (err as { data?: { message?: string } })?.data?.message ??
          "Could not verify volunteer.",
      }),
  });
  const verifyVul = useMutation({
    mutationFn: (id: number) => verifyVulnerable(id, { credentials: "include" }),
    onSuccess: () => {
      setMsg({ kind: "ok", text: "Vulnerable resident verified." });
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["/api/reviewer/pending-vulnerable"] });
    },
    onError: (err) =>
      setMsg({
        kind: "err",
        text:
          (err as { data?: { message?: string } })?.data?.message ??
          "Could not verify vulnerable.",
      }),
  });

  const data = list.data;
  const counts = {
    volunteer: data?.volunteers.length ?? 0,
    vulnerable: data?.vulnerables.length ?? 0,
  };

  return (
    <section className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex border-b border-stone-200 bg-stone-50">
        {(["vulnerable", "volunteer"] as const).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setMsg(null);
            }}
            className={`px-5 py-3 text-sm font-medium border-b-2 capitalize transition ${
              tab === t
                ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))] bg-white"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            {t === "vulnerable" ? "Vulnerable residents" : "Volunteers"}{" "}
            <span className="ml-1 text-xs text-stone-500">({counts[t]})</span>
          </button>
        ))}
      </div>

      {msg && (
        <div
          className={`mx-6 mt-4 text-sm rounded-lg px-3 py-2 ${
            msg.kind === "ok"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {msg.text}
        </div>
      )}

      <div className="p-6">
        {list.isLoading ? (
          <p className="text-sm text-stone-500">Loading…</p>
        ) : !data ? (
          <p className="text-sm text-red-600">Could not load users.</p>
        ) : tab === "vulnerable" ? (
          <ul className="divide-y divide-stone-200">
            {data.vulnerables.length === 0 && (
              <p className="text-sm text-stone-500">No Vulnerable accounts yet.</p>
            )}
            {data.vulnerables.map((v) => (
              <li key={v.id} className="py-4 flex flex-wrap items-start justify-between gap-4">
                <div className="text-sm flex-1 min-w-[260px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-stone-900">{v.name}</p>
                    <span className="text-stone-500 font-mono text-xs">{v.email}</span>
                    {v.disabled && (
                      <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                        Disabled
                      </span>
                    )}
                    {v.verified ? (
                      <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-green-100 text-green-800 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        Awaiting verify
                      </span>
                    )}
                    {!v.emailVerified && (
                      <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                        Email unverified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    ID #{v.id} · Joined {new Date(v.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-1.5 text-xs text-stone-700 space-y-0.5">
                    <div>Address: {v.address}</div>
                    <div>
                      Next of kin: {v.nokName} ({v.nokRelation}) — {v.nokContact}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => verifyVul.mutate(v.id)}
                  disabled={v.verified || verifyVul.isPending}
                  title={v.verified ? "Already verified" : "Mark as verified"}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold border border-green-300 text-green-700 rounded-md px-3 py-1.5 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {v.verified ? "Verified" : "Verify"}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-stone-200">
            {data.volunteers.length === 0 && (
              <p className="text-sm text-stone-500">No Volunteer accounts yet.</p>
            )}
            {data.volunteers.map((v) => (
              <li key={v.id} className="py-4 flex flex-wrap items-start justify-between gap-4">
                <div className="text-sm flex-1 min-w-[260px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-stone-900">{v.name}</p>
                    <span className="text-stone-500 font-mono text-xs">{v.email}</span>
                    {v.disabled && (
                      <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                        Disabled
                      </span>
                    )}
                    {v.verified ? (
                      <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-green-100 text-green-800 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        Awaiting verify
                      </span>
                    )}
                    {!v.emailVerified && (
                      <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-orange-100 text-orange-800">
                        Email unverified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    ID #{v.id} · Joined {new Date(v.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-1.5 text-xs text-stone-700 space-y-0.5">
                    {v.skills && <div>Skills: {v.skills}</div>}
                    <div>
                      GPS consent: {v.gpsConsent ? "yes" : "no"}
                      {v.lastSeenAt && (
                        <> · Last seen {new Date(v.lastSeenAt).toLocaleString()}</>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => verifyVol.mutate(v.id)}
                  disabled={v.verified || verifyVol.isPending}
                  title={v.verified ? "Already verified" : "Mark as verified"}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold border border-green-300 text-green-700 rounded-md px-3 py-1.5 hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {v.verified ? "Verified" : "Verify"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
