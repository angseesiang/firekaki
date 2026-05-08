import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import {
  Flame,
  Mail,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Siren,
  ShieldCheck,
  UserCheck,
  PowerOff,
  Loader2,
  Bell,
  Phone,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listEmergencies,
  createEmergency,
  deactivateEmergency,
  respondEmergency,
  arriveEmergency,
  listPendingVulnerable,
  verifyVulnerable,
  updateVolunteerLocation,
  getVulnerableMe,
  updateVulnerableLocation,
  getNokMe,
  type Emergency,
  type PendingVulnerable,
} from "@workspace/api-client-react";
import { useMe, useLogout, useResendVerification } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const EMERGENCIES_KEY = ["/api/emergencies"] as const;
const PENDING_KEY = ["/api/reviewer/pending-vulnerable"] as const;

export default function DashboardPage() {
  const me = useMe();
  const logout = useLogout();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (me.isLoading) return;
    if (!me.data) navigate("/login");
    else if (me.data.role === "admin") navigate("/admin");
    else if (me.data.role === "reviewer") navigate("/reviewer");
  }, [me.isLoading, me.data, navigate]);

  if (me.isLoading || !me.data) {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <p className="text-stone-500">Loading…</p>
      </div>
    );
  }

  const u = me.data;
  const isAdmin = u.role === "admin";
  const isReviewerOrHigher = isAdmin || u.role === "reviewer";
  const isVolunteer = u.role === "volunteer";
  const isVulnerable = u.role === "vulnerable";
  const isNok = u.role === "nok";
  const isMinimal = isVulnerable || isNok;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-[hsl(var(--primary))]">
            <Flame className="w-5 h-5" />
            <span className="font-serif text-xl font-bold">Fire Kaki</span>
          </Link>
          <div className="flex items-center gap-4">
            {isAdmin ? (
              <Link
                href="/admin"
                className="text-sm font-medium text-stone-600 hover:text-[hsl(var(--primary))]"
              >
                Manage users
              </Link>
            ) : isReviewerOrHigher ? (
              <Link
                href="/reviewer/users"
                className="text-sm font-medium text-stone-600 hover:text-[hsl(var(--primary))]"
              >
                Manage users
              </Link>
            ) : null}
            {isVulnerable && (
              <Link
                href="/my-requests"
                className="text-sm font-medium text-stone-600 hover:text-[hsl(var(--primary))]"
              >
                Past requests
              </Link>
            )}
            <button
              onClick={() => logout.mutate(undefined, { onSuccess: () => navigate("/") })}
              className="text-sm text-stone-600 hover:text-stone-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {!isMinimal && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--primary))] mb-2">
              Signed in · {u.role}
            </p>
            <h1 className="font-serif text-4xl font-bold text-stone-900">
              Welcome, {u.name}.
            </h1>
          </div>
        )}


        {(isReviewerOrHigher || isNok) && <EmergencyNotifier userId={u.id} />}

        {isVulnerable && <VulnerablePanel name={u.name} verified={u.verified ?? false} />}
        {isNok && <NokPanel name={u.name} />}
        {isVolunteer && <VolunteerPanel />}
        {isReviewerOrHigher && <ReviewerPanel canDeactivate={isAdmin} canCreateMajor />}

        {!isMinimal && (
          <p className="text-xs text-stone-500">
            Logged in to the <span className="font-mono">{u.role}_users</span> vault ·{" "}
            <span className="font-mono">{u.email}</span>
          </p>
        )}
      </main>
    </div>
  );
}

/* ─────────── Email verification banner ─────────── */

function EmailVerificationBanner() {
  const me = useMe();
  const resend = useResendVerification();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const u = me.data;
  if (!u) return null;
  if (u.role !== "volunteer" && u.role !== "vulnerable") return null;
  if (u.emailVerified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2 text-sm text-green-800">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        Email verified — your account is fully active.
      </div>
    );
  }
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-3">
      <Mail className="w-5 h-5 mt-0.5 text-amber-700 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold text-amber-900">Confirm your email address</p>
        <p className="text-sm text-amber-800 mt-1">
          We sent a verification link to <span className="font-mono">{u.email}</span>.
        </p>
        {msg && (
          <p className={`text-sm mt-2 ${msg.kind === "ok" ? "text-green-700" : "text-red-700"}`}>
            {msg.text}
          </p>
        )}
        <button
          onClick={() => {
            setMsg(null);
            resend.mutate(undefined, {
              onSuccess: () =>
                setMsg({ kind: "ok", text: "Sent — check your inbox (and spam folder)." }),
              onError: (err) =>
                setMsg({
                  kind: "err",
                  text:
                    (err as { data?: { message?: string } })?.data?.message ??
                    "Could not resend right now.",
                }),
            });
          }}
          disabled={resend.isPending}
          className="mt-3 text-sm font-medium text-amber-900 hover:text-amber-700 underline disabled:opacity-60"
        >
          {resend.isPending ? "Resending…" : "Resend verification email"}
        </button>
      </div>
    </div>
  );
}

/* ─────────── NOK: watch over linked vulnerable ─────────── */

function NokPanel({ name }: { name: string }) {
  const profile = useQuery({
    queryKey: ["/api/nok/me"] as const,
    queryFn: () => getNokMe({ credentials: "include" }),
  });
  const list = useQuery({
    queryKey: EMERGENCIES_KEY,
    queryFn: () => listEmergencies({ credentials: "include" }),
    refetchInterval: 8_000,
  });

  const items = list.data?.emergencies ?? [];
  const active = items.find((e) => e.status === "active");
  const p = profile.data;
  const firstName = name.split(" ")[0] ?? name;

  return (
    <section className="max-w-md mx-auto">
      <h1 className="font-serif text-4xl font-bold text-stone-900 text-center">
        Hi, {firstName}
      </h1>
      <p className="text-stone-600 mt-3 text-center">
        You'll be notified the moment {p?.linkedVulnerable.name ?? "your loved one"} presses
        for help.
      </p>

      {p && (
        <div className="mt-8 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <ShieldCheck className="w-4 h-4 text-[hsl(var(--primary))]" />
            Watching over
          </div>
          <p className="mt-2 font-serif text-2xl font-bold text-stone-900">
            {p.linkedVulnerable.name}
          </p>
          <p className="text-sm text-stone-600 mt-1">{p.linkedVulnerable.address}</p>
          <p className="text-xs text-stone-500 mt-3">
            {p.linkedVulnerable.lastSeenAt
              ? `Last GPS update: ${new Date(p.linkedVulnerable.lastSeenAt).toLocaleString()}`
              : "No GPS update yet."}
          </p>
        </div>
      )}

      {active ? (
        <div className="mt-6 bg-red-50 border-2 border-[hsl(var(--primary))] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 text-[hsl(var(--primary))] font-bold uppercase tracking-wider text-sm">
            <Siren className="w-5 h-5" />
            SOS active right now
          </div>
          <p className="mt-2 text-stone-900">
            {p?.linkedVulnerable.name ?? "They"} pressed SOS at{" "}
            {new Date(active.createdAt).toLocaleTimeString()}.
          </p>
          {active.address && (
            <p className="text-sm text-stone-700 mt-1">{active.address}</p>
          )}
          <ResponderStatus emergency={active} />
        </div>
      ) : (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-5 text-sm text-green-800 inline-flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          All clear — no active SOS right now.
        </div>
      )}

      <h2 className="font-serif text-lg font-bold text-stone-900 mt-8 mb-3">Recent SOS history</h2>
      {items.length === 0 ? (
        <p className="text-sm text-stone-500">No requests recorded yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.slice(0, 10).map((e) => (
            <EmergencyRow key={e.id} e={e} />
          ))}
        </ul>
      )}
    </section>
  );
}

/* ─────────── shared: live responder/ETA card ─────────── */

function formatLiveEta(seconds: number | null | undefined): string {
  if (seconds == null) return "calculating…";
  if (seconds < 60) return "less than 1 min";
  const mins = Math.round(seconds / 60);
  return `~${mins} min`;
}

function formatDistance(m: number | null | undefined): string | null {
  if (m == null) return null;
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

function ResponderStatus({ emergency }: { emergency: Emergency }) {
  const stats = emergency.responseStats;
  const responders = emergency.responders ?? [];
  const accepted = stats?.accepted ?? responders.length;
  const arrived = stats?.arrived ?? responders.filter((r) => r.arrivedAt).length;

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-3xl font-serif font-bold text-[hsl(var(--primary))]">
          {accepted}
        </span>
        <span className="text-sm text-stone-700">
          neighbour{accepted === 1 ? "" : "s"} accepted
          {arrived > 0 && (
            <>
              {" · "}
              <span className="font-semibold text-green-700">{arrived} arrived</span>
            </>
          )}
        </span>
      </div>

      {accepted === 0 ? (
        <p className="text-xs text-stone-600">
          Waiting for the first neighbour to accept… you'll see them here the moment they do.
        </p>
      ) : (
        <ul className="divide-y divide-red-100 border border-red-100 bg-white rounded-lg overflow-hidden">
          {responders.map((r) => {
            const dist = formatDistance(r.distanceM);
            return (
              <li
                key={r.volunteerId}
                className="px-3 py-2 flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900 truncate">{r.name}</p>
                  {dist && (
                    <p className="text-xs text-stone-500">{dist} away</p>
                  )}
                </div>
                {r.arrivedAt ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-1 whitespace-nowrap">
                    <CheckCircle2 className="w-3 h-3" />
                    Arrived
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[hsl(var(--primary))] bg-red-50 border border-red-200 rounded-md px-2 py-1 whitespace-nowrap">
                    <MapPin className="w-3 h-3" />
                    ETA {formatLiveEta(r.etaSeconds)}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ─────────── VULNERABLE: request help + own history ─────────── */

function VulnerablePanel({ name, verified }: { name: string; verified: boolean }) {
  const qc = useQueryClient();
  const profile = useQuery({
    queryKey: ["/api/vulnerable/me"] as const,
    queryFn: () => getVulnerableMe({ credentials: "include" }),
  });
  const list = useQuery({
    queryKey: EMERGENCIES_KEY,
    queryFn: () => listEmergencies({ credentials: "include" }),
    refetchInterval: 8_000,
  });
  const activeEmergency = list.data?.emergencies.find((e) => e.status === "active");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [submitOk, setSubmitOk] = useState(false);

  const saveLoc = useMutation({
    mutationFn: (body: { lat: number; lng: number }) =>
      updateVulnerableLocation(body, { credentials: "include" }),
  });

  // auto-track location: watchPosition keeps coords fresh and pushes to server
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        saveLoc.mutate(c);
      },
      () => {
        // silently ignore — SOS still works without coords
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 30_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = useMutation({
    mutationFn: () =>
      createEmergency(
        {
          type: "minor",
          lat: coords?.lat,
          lng: coords?.lng,
        },
        { credentials: "include" },
      ),
    onSuccess: () => {
      setSubmitOk(true);
      qc.invalidateQueries({ queryKey: EMERGENCIES_KEY });
      window.setTimeout(() => setSubmitOk(false), 6_000);
    },
    onError: (err) =>
      setSubmitErr(
        (err as { data?: { message?: string } })?.data?.message ?? "Could not send request.",
      ),
  });

  function onSos() {
    setSubmitErr(null);
    setSubmitOk(false);
    if (!verified) {
      setSubmitErr("Awaiting Reviewer verification — you can't request help yet.");
      return;
    }
    create.mutate();
  }

  const p = profile.data;
  const firstName = name.split(" ")[0] ?? name;
  const greeting = name.toLowerCase().startsWith("madam") ? name : `Madam ${firstName}`;

  return (
    <section className="max-w-md mx-auto text-center">
      <h1 className="font-serif text-4xl font-bold text-stone-900">Hi, {greeting}</h1>
      <p className="text-stone-600 mt-3 text-lg">
        Press the button if you need help. Help comes to you.
      </p>

      {!verified && (
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900 text-left">
          <strong>Awaiting Reviewer verification.</strong> Once a Reviewer confirms your details,
          you'll be able to press SOS.
        </div>
      )}

      <div className="my-12 flex justify-center">
        <button
          type="button"
          onClick={onSos}
          disabled={create.isPending || !verified || !!activeEmergency}
          aria-label="Send SOS"
          className="w-56 h-56 rounded-full bg-[hsl(var(--primary))] text-white shadow-xl hover:opacity-90 active:scale-95 transition disabled:opacity-60 disabled:active:scale-100 flex flex-col items-center justify-center gap-2"
        >
          {create.isPending ? (
            <Loader2 className="w-16 h-16 animate-spin" />
          ) : (
            <Bell className="w-20 h-20" strokeWidth={1.8} />
          )}
          <span className="font-serif text-3xl font-bold tracking-wide">SOS</span>
        </button>
      </div>

      {submitOk && (
        <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 inline-flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Help is on the way.
        </p>
      )}
      {submitErr && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {submitErr}
        </p>
      )}

      {activeEmergency && (
        <div className="mt-2 mb-6 bg-red-50 border-2 border-[hsl(var(--primary))] rounded-2xl p-5 text-left shadow-sm">
          <div className="flex items-center gap-2 text-[hsl(var(--primary))] font-bold uppercase tracking-wider text-xs">
            <Siren className="w-4 h-4" />
            Help is on the way
          </div>
          <p className="mt-2 text-sm text-stone-700">
            Sent at {new Date(activeEmergency.createdAt).toLocaleTimeString()}.
          </p>
          <ResponderStatus emergency={activeEmergency} />
        </div>
      )}

      {p && (
        <div className="mt-6 bg-white border border-stone-200 rounded-2xl p-5 text-left shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <Phone className="w-4 h-4 text-stone-500" />
            Next of kin on file
          </div>
          <p className="mt-2 font-serif text-xl font-bold text-stone-900">{p.nokName}</p>
          <p className="text-sm text-stone-600">{p.nokRelation}</p>
        </div>
      )}

      <p className="mt-6 text-[11px] text-stone-400">
        {coords
          ? `Location auto-shared · ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
          : "Waiting for location…"}
      </p>
    </section>
  );
}

/* ─────────── VOLUNTEER: GPS + nearby alerts ─────────── */

function VolunteerPanel() {
  const qc = useQueryClient();
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const list = useQuery({
    queryKey: EMERGENCIES_KEY,
    queryFn: () => listEmergencies({ credentials: "include" }),
    refetchInterval: 8_000,
  });

  const updateLoc = useMutation({
    mutationFn: (body: { lat: number; lng: number }) =>
      updateVolunteerLocation(body, { credentials: "include" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMERGENCIES_KEY }),
  });

  const respond = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "accepted" | "declined" }) =>
      respondEmergency(id, { status }, { credentials: "include" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMERGENCIES_KEY }),
  });

  const arrive = useMutation({
    mutationFn: (id: number) => arriveEmergency(id, { credentials: "include" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMERGENCIES_KEY }),
  });

  function shareLocation() {
    setGeoStatus(null);
    if (!navigator.geolocation) {
      setGeoStatus("Geolocation not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        updateLoc.mutate(c, {
          onSuccess: () => setGeoStatus("Location shared — alerts within 2 km will appear below."),
          onError: (err) =>
            setGeoStatus(
              (err as { data?: { message?: string } })?.data?.message ?? "Could not save location.",
            ),
        });
      },
      (err) => setGeoStatus(err.message),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  }

  const items = list.data?.emergencies ?? [];

  return (
    <section className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
      <SectionHeader
        icon={<MapPin className="w-5 h-5" />}
        title="Nearby alerts"
        subtitle="You'll be paged for active emergencies within a 2 km radius of your shared location."
      />

      <div className="bg-stone-50 border border-stone-200 rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-stone-900 text-sm">GPS matching</p>
            <p className="text-xs text-stone-600 mt-0.5">
              {coords
                ? `Last shared: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`
                : "Mandatory for the alert radius to work."}
            </p>
          </div>
          <button
            onClick={shareLocation}
            disabled={updateLoc.isPending}
            className="inline-flex items-center gap-2 text-sm bg-stone-900 text-white rounded-lg px-3 py-2 hover:bg-stone-700 disabled:opacity-60"
          >
            <MapPin className="w-4 h-4" />
            {coords ? "Refresh location" : "Share my location"}
          </button>
        </div>
        {geoStatus && <p className="text-xs text-stone-700 mt-2">{geoStatus}</p>}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-stone-500">
          No alerts in your area right now. Share your location and keep this tab open.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((e) => (
            <EmergencyRow
              key={e.id}
              e={e}
              actions={
                e.status === "active" && e.myResponse === "accepted" ? (
                  e.myArrivedAt ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Arrived {new Date(e.myArrivedAt).toLocaleTimeString()}
                    </span>
                  ) : (
                    <button
                      onClick={() => arrive.mutate(e.id)}
                      disabled={arrive.isPending}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold bg-green-600 text-white rounded-md px-3 py-1.5 hover:bg-green-700 disabled:opacity-60"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark arrived
                    </button>
                  )
                ) : e.status === "active" ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        respond.mutate({ id: e.id, status: "accepted" })
                      }
                      disabled={respond.isPending}
                      className="text-xs font-semibold bg-[hsl(var(--primary))] text-white rounded-md px-3 py-1.5 hover:opacity-90"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        respond.mutate({ id: e.id, status: "declined" })
                      }
                      disabled={respond.isPending}
                      className="text-xs font-semibold border border-stone-300 rounded-md px-3 py-1.5 hover:bg-stone-50"
                    >
                      Decline
                    </button>
                  </div>
                ) : null
              }
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/* ─────────── REVIEWER (and Admin): verifications + activate major + all emergencies ─────────── */

function ReviewerPanel({
  canDeactivate,
  canCreateMajor,
}: {
  canDeactivate: boolean;
  canCreateMajor: boolean;
}) {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: EMERGENCIES_KEY,
    queryFn: () => listEmergencies({ credentials: "include" }),
    refetchInterval: 8_000,
  });
  const pending = useQuery({
    queryKey: PENDING_KEY,
    queryFn: () => listPendingVulnerable({ credentials: "include" }),
  });

  const verify = useMutation({
    mutationFn: (id: number) => verifyVulnerable(id, { credentials: "include" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: PENDING_KEY }),
  });

  const deactivate = useMutation({
    mutationFn: (id: number) => deactivateEmergency(id, { credentials: "include" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMERGENCIES_KEY }),
  });

  const items = list.data?.emergencies ?? [];
  const pendingItems: PendingVulnerable[] = pending.data?.items ?? [];

  return (
    <div className="space-y-8">
      {canCreateMajor && <ActivateMajorCard />}

      <section className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
        <SectionHeader
          icon={<UserCheck className="w-5 h-5" />}
          title={`Pending vulnerable verifications (${pendingItems.length})`}
          subtitle="Confirm identity, residence, and next-of-kin before granting help-request access."
        />
        {pendingItems.length === 0 ? (
          <p className="text-sm text-stone-500">No pending verifications. </p>
        ) : (
          <ul className="divide-y divide-stone-200">
            {pendingItems.map((p) => (
              <li key={p.id} className="py-4 flex flex-wrap items-start justify-between gap-4">
                <div className="text-sm">
                  <p className="font-semibold text-stone-900">
                    {p.name}{" "}
                    <span className="text-stone-500 font-normal font-mono">{p.email}</span>
                  </p>
                  <p className="text-stone-700 mt-0.5">{p.address}</p>
                  <p className="text-stone-600 mt-0.5">
                    NOK: {p.nokName} ({p.nokRelation}) · {p.nokContact}
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Email {p.emailVerified ? "verified" : "not yet verified"} · Registered{" "}
                    {new Date(p.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => verify.mutate(p.id)}
                  disabled={verify.isPending}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[hsl(var(--primary))] text-white rounded-lg px-4 py-2 hover:opacity-90 disabled:opacity-60"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Verify
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
        <SectionHeader
          icon={<Siren className="w-5 h-5" />}
          title={`All emergencies (${items.length})`}
          subtitle={
            canDeactivate
              ? "Admin oversight — you alone can deactivate an active emergency."
              : "Reviewer view — read-only."
          }
        />
        {items.length === 0 ? (
          <p className="text-sm text-stone-500">No emergencies on record.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((e) => (
              <EmergencyRow
                key={e.id}
                e={e}
                actions={
                  canDeactivate && e.status === "active" ? (
                    <button
                      onClick={() => deactivate.mutate(e.id)}
                      disabled={deactivate.isPending}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold border border-red-300 text-red-700 rounded-md px-3 py-1.5 hover:bg-red-50"
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                      Deactivate
                    </button>
                  ) : null
                }
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ActivateMajorCard() {
  const qc = useQueryClient();
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const create = useMutation({
    mutationFn: () =>
      createEmergency(
        {
          type: "major",
          description: description.trim() || undefined,
          address: address.trim() || undefined,
          lat: coords?.lat,
          lng: coords?.lng,
        },
        { credentials: "include" },
      ),
    onSuccess: () => {
      setDescription("");
      setAddress("");
      setCoords(null);
      setOk(true);
      qc.invalidateQueries({ queryKey: EMERGENCIES_KEY });
    },
  });

  function shareLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) =>
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
    );
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    create.mutate(undefined, {
      onError: (err) =>
        setErr(
          (err as { data?: { message?: string } })?.data?.message ??
            "Could not activate major emergency.",
        ),
    });
  }

  return (
    <section className="bg-white border-2 border-[hsl(var(--primary))]/30 rounded-2xl p-8 shadow-sm">
      <SectionHeader
        icon={<AlertTriangle className="w-5 h-5 text-[hsl(var(--primary))]" />}
        title="Activate Major emergency"
        subtitle="Pages every volunteer in the affected area. Use only for confirmed serious incidents."
      />
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            Description
          </label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="e.g. Block-wide kitchen fire reported at Blk 207 Jln Besar"
            className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
            Address (optional)
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={shareLocation}
            className="inline-flex items-center gap-2 text-sm border border-stone-300 rounded-lg px-3 py-2 hover:bg-stone-50"
          >
            <MapPin className="w-4 h-4" />
            {coords ? "Update GPS" : "Pin GPS"}
          </button>
          {coords && (
            <span className="text-xs text-stone-600 font-mono">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </span>
          )}
        </div>
        {err && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {err}
          </p>
        )}
        {ok && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Major emergency activated and broadcast.
          </p>
        )}
        <button
          type="submit"
          disabled={create.isPending}
          className="inline-flex items-center gap-2 bg-[hsl(var(--primary))] text-white rounded-lg px-5 py-2.5 font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {create.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Siren className="w-4 h-4" />}
          Activate Major
        </button>
      </form>
    </section>
  );
}

/* ─────────── Emergency notifier (Reviewer + Admin) ─────────── */

function EmergencyNotifier({ userId }: { userId: number }) {
  const { toast } = useToast();
  const seenRef = useRef<{ ready: boolean; ids: Set<number> }>({
    ready: false,
    ids: new Set(),
  });
  const storageKey = `firekaki:lastSeenEmergencyId:${userId}`;
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    typeof Notification === "undefined" ? "unsupported" : Notification.permission,
  );

  const list = useQuery({
    queryKey: EMERGENCIES_KEY,
    queryFn: () => listEmergencies({ credentials: "include" }),
    refetchInterval: 8_000,
  });

  useEffect(() => {
    const data = list.data?.emergencies;
    if (!data) return;
    const lastSeen = Number(localStorage.getItem(storageKey) ?? "0");
    if (!seenRef.current.ready) {
      // first load — record everything we've already seen, never alert on backlog
      data.forEach((e) => seenRef.current.ids.add(e.id));
      const maxId = data.reduce((m, e) => Math.max(m, e.id), lastSeen);
      localStorage.setItem(storageKey, String(maxId));
      seenRef.current.ready = true;
      return;
    }
    const fresh = data.filter(
      (e) =>
        e.status === "active" &&
        !seenRef.current.ids.has(e.id) &&
        e.id > lastSeen,
    );
    if (fresh.length === 0) return;
    fresh.forEach((e) => {
      seenRef.current.ids.add(e.id);
      const title = `${e.type === "major" ? "MAJOR" : "Minor"} emergency from ${e.creatorName}`;
      const body = e.description ?? `${e.creatorRole} requested help`;
      toast({
        title,
        description: body,
        variant: e.type === "major" ? "destructive" : undefined,
      });
      if (
        typeof Notification !== "undefined" &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(title, { body, tag: `firekaki-emergency-${e.id}` });
        } catch {
          // ignore
        }
      }
    });
    const maxId = data.reduce((m, e) => Math.max(m, e.id), lastSeen);
    localStorage.setItem(storageKey, String(maxId));
  }, [list.data, storageKey, toast]);

  if (permission === "unsupported" || permission === "granted") return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <span className="text-blue-900">
        Enable browser notifications to be paged for new emergencies even when this tab is in the
        background.
      </span>
      <button
        onClick={async () => {
          if (typeof Notification === "undefined") return;
          const r = await Notification.requestPermission();
          setPermission(r);
        }}
        disabled={permission === "denied"}
        className="text-xs font-semibold bg-blue-600 text-white rounded-md px-3 py-1.5 hover:bg-blue-700 disabled:opacity-60"
      >
        {permission === "denied" ? "Blocked in browser" : "Enable notifications"}
      </button>
    </div>
  );
}

/* ─────────── shared bits ─────────── */

function SectionHeader({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="font-serif text-2xl font-bold text-stone-900">{title}</h2>
        {subtitle && <p className="text-sm text-stone-600 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

function EmergencyRow({ e, actions }: { e: Emergency; actions?: React.ReactNode }) {
  const isMajor = e.type === "major";
  const statusBadge =
    e.status === "active"
      ? "bg-red-50 text-red-700 border-red-200"
      : e.status === "deactivated"
        ? "bg-stone-100 text-stone-600 border-stone-200"
        : "bg-green-50 text-green-700 border-green-200";
  return (
    <li className="border border-stone-200 rounded-lg p-4 flex flex-wrap items-start justify-between gap-3">
      <div className="text-sm flex-1 min-w-[200px]">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
              isMajor
                ? "bg-[hsl(var(--primary))] text-white"
                : "bg-amber-100 text-amber-900"
            }`}
          >
            {e.type}
          </span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${statusBadge}`}>
            {e.status}
          </span>
          <span className="text-xs text-stone-500">
            by {e.creatorName} ({e.creatorRole}) ·{" "}
            {new Date(e.createdAt).toLocaleString()}
          </span>
          {e.distanceM != null && (
            <span className="text-xs text-stone-700 font-mono">
              {e.distanceM < 1000
                ? `${e.distanceM} m`
                : `${(e.distanceM / 1000).toFixed(2)} km`}{" "}
              away
            </span>
          )}
          {e.myResponse && (
            <span className="text-xs font-semibold text-stone-700">
              · you {e.myResponse}
            </span>
          )}
        </div>
        {e.description && <p className="text-stone-800 mt-2">{e.description}</p>}
        {e.address && <p className="text-stone-600 text-xs mt-1">{e.address}</p>}
        {e.responseStats && (e.responseStats.total > 0 || e.status === "active") && (
          <div className="mt-2 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800">
              <span className="font-semibold">{e.responseStats.accepted}</span> accepted
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700">
              <span className="font-semibold">{e.responseStats.declined}</span> declined
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 border border-green-300 text-green-900">
              <CheckCircle2 className="w-3 h-3" />
              <span className="font-semibold">{e.responseStats.arrived}</span> arrived
            </span>
          </div>
        )}
        {e.responders && e.responders.length > 0 && (
          <div className="mt-3 border-t border-stone-100 pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
              Responding volunteers ({e.responders.length})
            </p>
            <ul className="space-y-1">
              {e.responders.map((r) => (
                <li
                  key={r.volunteerId}
                  className="flex flex-wrap items-center justify-between gap-2 text-xs bg-stone-50 rounded px-2 py-1.5"
                >
                  <span className="font-medium text-stone-800">{r.name}</span>
                  <span className="font-mono text-stone-700">
                    {r.arrivedAt ? (
                      <span className="text-green-700 font-semibold">
                        ✓ arrived {new Date(r.arrivedAt).toLocaleTimeString()}
                      </span>
                    ) : r.etaSeconds != null ? (
                      <>
                        {r.distanceM != null
                          ? r.distanceM < 1000
                            ? `${r.distanceM} m`
                            : `${(r.distanceM / 1000).toFixed(2)} km`
                          : "—"}{" "}
                        · ETA {formatEta(r.etaSeconds)}
                      </>
                    ) : (
                      <span className="text-stone-500">no GPS yet</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {actions}
    </li>
  );
}

function formatEta(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  if (m < 60) return r ? `${m}m ${r}s` : `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}
