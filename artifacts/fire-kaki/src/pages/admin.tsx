import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import {
  Activity,
  ShieldCheck,
  Users,
  Heart,
  AlertTriangle,
  Pencil,
  Power,
  Trash2,
  UserX,
  ShieldPlus,
  CheckCircle2,
  PowerOff,
  Plus,
  Loader2,
  MapPin,
  Siren,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminListAllUsers,
  adminListVolunteerLocations,
  adminCreateUser,
  adminDisableUser,
  adminEnableUser,
  adminDeleteUser,
  listEmergencies,
  createEmergency,
  deactivateEmergency,
  verifyVolunteer,
  verifyVulnerable,
  type AdminCreateUserRequest,
  type AdminCreatedUser,
  type AdminUsersOverview,
  type Emergency,
  type ManagedUserRole,
} from "@workspace/api-client-react";
import { useMe, useLogout } from "@/lib/auth";
import {
  DashShell,
  StatCard,
  StatusBadge,
  SectionHeading,
  type SectionDef,
} from "@/components/dash-shell";
import {
  UserEditModal,
  type EditableRow,
  type EditableUserRole,
} from "@/components/user-edit-modal";
import { EmergencyMap } from "@/components/emergency-map";

const USERS_KEY = ["/api/admin/users-overview"] as const;
const EMERG_KEY = ["/api/emergencies"] as const;

type SectionKey =
  | "overview"
  | "verifications"
  | "volunteers"
  | "vulnerable"
  | "emergencies"
  | "staff";

const SECTIONS: SectionDef<SectionKey>[] = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "verifications", label: "Verifications", icon: ShieldCheck },
  { key: "volunteers", label: "Volunteers", icon: Users },
  { key: "vulnerable", label: "Vulnerable", icon: Heart },
  { key: "emergencies", label: "Live emergencies", icon: AlertTriangle },
  { key: "staff", label: "Staff", icon: ShieldPlus },
];

export default function AdminPage() {
  const me = useMe();
  const logout = useLogout();
  const [, navigate] = useLocation();
  const [section, setSection] = useState<SectionKey>("overview");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (me.isLoading) return;
    if (!me.data) navigate("/login");
    else if (me.data.role !== "admin") navigate("/dashboard");
  }, [me.isLoading, me.data, navigate]);

  const overview = useQuery({
    queryKey: USERS_KEY,
    queryFn: () => adminListAllUsers({ credentials: "include" }),
    enabled: me.data?.role === "admin",
  });
  const emergencies = useQuery({
    queryKey: EMERG_KEY,
    queryFn: () => listEmergencies({ credentials: "include" }),
    enabled: me.data?.role === "admin",
    refetchInterval: 8_000,
  });

  if (me.isLoading || !me.data || me.data.role !== "admin") {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-stone-500">Loading…</p>
      </div>
    );
  }

  return (
    <DashShell
      brand="Fire Kaki Admin"
      sections={SECTIONS}
      active={section}
      onSectionChange={(k) => setSection(k)}
      search={search}
      onSearchChange={setSearch}
      onSignOut={() =>
        logout.mutate(undefined, { onSuccess: () => navigate("/") })
      }
    >
      <AdminContent
        section={section}
        search={search}
        currentAdminId={me.data.id}
        users={overview.data}
        usersLoading={overview.isLoading}
        emergencies={emergencies.data?.emergencies ?? []}
      />
    </DashShell>
  );
}

function AdminContent({
  section,
  search,
  currentAdminId,
  users,
  usersLoading,
  emergencies,
}: {
  section: SectionKey;
  search: string;
  currentAdminId: number;
  users: AdminUsersOverview | undefined;
  usersLoading: boolean;
  emergencies: Emergency[];
}) {
  const stats = useMemo(() => {
    if (!users) return { verified: 0, activeVols: 0, live: 0, coverage: 0 };
    const verified = users.vulnerables.filter((v) => v.verified).length;
    const activeVols = users.volunteers.filter((v) => !v.disabled).length;
    const live = emergencies.filter((e) => e.status === "active").length;
    const totalVols = users.volunteers.length;
    const withGps = users.volunteers.filter((v) => v.gpsConsent).length;
    const coverage = totalVols === 0 ? 0 : Math.round((withGps / totalVols) * 100);
    return { verified, activeVols, live, coverage };
  }, [users, emergencies]);

  if (usersLoading || !users) {
    return <p className="text-sm text-stone-500">Loading…</p>;
  }

  if (section === "overview") {
    return (
      <OverviewSection
        stats={stats}
        users={users}
        emergencies={emergencies}
        search={search}
      />
    );
  }
  if (section === "verifications") {
    return <VerificationsSection users={users} search={search} canEdit />;
  }
  if (section === "volunteers") {
    return (
      <VolunteersSection
        users={users}
        emergencies={emergencies}
        search={search}
        scope="admin"
        canManage
      />
    );
  }
  if (section === "vulnerable") {
    return (
      <VulnerableSection
        users={users}
        emergencies={emergencies}
        search={search}
        scope="admin"
        canManage
      />
    );
  }
  if (section === "emergencies") {
    return (
      <div className="space-y-6">
        <ActivateEmergencyCard />
        <EmergenciesSection emergencies={emergencies} canDeactivate />
      </div>
    );
  }
  return <StaffSection users={users} currentAdminId={currentAdminId} />;
}

/* ───────────── Overview ───────────── */

function OverviewSection({
  stats,
  users,
  emergencies,
  search,
}: {
  stats: { verified: number; activeVols: number; live: number; coverage: number };
  users: AdminUsersOverview;
  emergencies: Emergency[];
  search: string;
}) {
  const liveByCreator = useMemo(() => {
    const map = new Map<number, Emergency>();
    emergencies
      .filter((e) => e.status === "active" && e.creatorRole === "vulnerable")
      .forEach((e) => map.set(e.creatorUserId, e));
    return map;
  }, [emergencies]);

  const queue = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.vulnerables
      .filter((v) =>
        q
          ? v.name.toLowerCase().includes(q) ||
            v.address.toLowerCase().includes(q) ||
            v.nokName.toLowerCase().includes(q)
          : true,
      )
      .sort((a, b) => {
        const aLive = liveByCreator.has(a.id) ? 1 : 0;
        const bLive = liveByCreator.has(b.id) ? 1 : 0;
        if (aLive !== bLive) return bLive - aLive;
        const aPending = a.verified ? 1 : 0;
        const bPending = b.verified ? 1 : 0;
        if (aPending !== bPending) return aPending - bPending;
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      })
      .slice(0, 8);
  }, [users.vulnerables, search, liveByCreator]);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard value={String(stats.verified)} label="Vulnerable Verified" />
        <StatCard value={String(stats.activeVols)} label="Volunteers Active" />
        <StatCard value={String(stats.live)} label="Live Emergencies" tone="danger" />
        <StatCard value={`${stats.coverage}%`} label="Coverage ≤ 2km" tone="success" />
      </div>

      <div>
        <h2 className="text-lg font-bold text-stone-900 mb-4">Verification Queue</h2>
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-[2fr_1.5fr_1.5fr_0.8fr_1fr] bg-stone-100 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <div>Resident</div>
            <div>Address</div>
            <div>Next of Kin</div>
            <div>Date</div>
            <div>Status</div>
          </div>
          {queue.length === 0 ? (
            <p className="px-6 py-8 text-sm text-stone-500">
              No residents match your search.
            </p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {queue.map((v) => {
                const live = liveByCreator.get(v.id);
                return (
                  <li
                    key={v.id}
                    className={`grid grid-cols-[2fr_1.5fr_1.5fr_0.8fr_1fr] items-center px-6 py-4 text-sm ${
                      live ? "bg-[hsl(var(--primary))]/5" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {live && (
                        <span className="w-2 h-2 rounded-full bg-[hsl(var(--primary))] shrink-0" />
                      )}
                      <span className="font-semibold text-stone-900">{v.name}</span>
                    </div>
                    <div className="text-stone-700">{v.address}</div>
                    <div className="text-stone-700">
                      {v.nokName ? `${v.nokName} · ${v.nokRelation}` : "—"}
                    </div>
                    <div className="text-stone-600">
                      {new Date(v.createdAt).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                    <div>
                      {live ? (
                        <StatusBadge
                          kind={live.type === "major" ? "live-major" : "live-minor"}
                        />
                      ) : v.verified ? (
                        <StatusBadge kind="verified" />
                      ) : (
                        <StatusBadge kind="pending" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────── Verifications ───────────── */

function VerificationsSection({
  users,
  search,
  canEdit,
}: {
  users: AdminUsersOverview;
  search: string;
  canEdit: boolean;
}) {
  const qc = useQueryClient();
  const [msg, setMsg] = useState<string | null>(null);

  const verifyVul = useMutation({
    mutationFn: (id: number) => verifyVulnerable(id, { credentials: "include" }),
    onSuccess: () => {
      setMsg("Vulnerable verified.");
      qc.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
  const verifyVol = useMutation({
    mutationFn: (id: number) => verifyVolunteer(id, { credentials: "include" }),
    onSuccess: () => {
      setMsg("Volunteer verified.");
      qc.invalidateQueries({ queryKey: USERS_KEY });
    },
  });

  const q = search.trim().toLowerCase();
  const pendingVul = users.vulnerables
    .filter((v) => !v.verified)
    .filter((v) => (q ? v.name.toLowerCase().includes(q) : true));
  const pendingVol = users.volunteers
    .filter((v) => !v.verified)
    .filter((v) => (q ? v.name.toLowerCase().includes(q) : true));

  void canEdit;

  return (
    <div className="space-y-8">
      {msg && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {msg}
        </p>
      )}

      <div>
        <SectionHeading
          title={`Vulnerable awaiting verification (${pendingVul.length})`}
          subtitle="Confirm identity, residence, and next-of-kin before granting help-request access."
        />
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {pendingVul.length === 0 ? (
            <p className="px-6 py-8 text-sm text-stone-500">All caught up.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {pendingVul.map((v) => (
                <li
                  key={v.id}
                  className="px-6 py-4 flex flex-wrap items-start justify-between gap-4"
                >
                  <div className="text-sm flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-stone-900">{v.name}</span>
                      <span className="text-stone-500 font-mono text-xs">{v.email}</span>
                      {!v.emailVerified && <StatusBadge kind="email-unverified" />}
                      {v.disabled && <StatusBadge kind="disabled" />}
                    </div>
                    <p className="text-xs text-stone-600 mt-1">{v.address}</p>
                    <p className="text-xs text-stone-600">
                      NOK: {v.nokName} ({v.nokRelation}) · {v.nokContact}
                    </p>
                  </div>
                  <button
                    onClick={() => verifyVul.mutate(v.id)}
                    disabled={verifyVul.isPending}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[hsl(var(--primary))] text-white rounded-lg px-4 py-2 hover:opacity-90 disabled:opacity-60"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Verify
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div>
        <SectionHeading
          title={`Volunteers awaiting verification (${pendingVol.length})`}
          subtitle="Vouch for trained neighbours so they can be paged for emergencies."
        />
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          {pendingVol.length === 0 ? (
            <p className="px-6 py-8 text-sm text-stone-500">All caught up.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {pendingVol.map((v) => (
                <li
                  key={v.id}
                  className="px-6 py-4 flex flex-wrap items-start justify-between gap-4"
                >
                  <div className="text-sm flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-stone-900">{v.name}</span>
                      <span className="text-stone-500 font-mono text-xs">{v.email}</span>
                      {!v.emailVerified && <StatusBadge kind="email-unverified" />}
                      {v.disabled && <StatusBadge kind="disabled" />}
                    </div>
                    {v.skills && (
                      <p className="text-xs text-stone-600 mt-1">Skills: {v.skills}</p>
                    )}
                  </div>
                  <button
                    onClick={() => verifyVol.mutate(v.id)}
                    disabled={verifyVol.isPending}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[hsl(var(--primary))] text-white rounded-lg px-4 py-2 hover:opacity-90 disabled:opacity-60"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Verify
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────── Volunteers ───────────── */

function VolunteersSection({
  users,
  emergencies,
  search,
  scope,
  canManage,
}: {
  users: AdminUsersOverview;
  emergencies: Emergency[];
  search: string;
  scope: "admin" | "reviewer";
  canManage: boolean;
}) {
  const q = search.trim().toLowerCase();
  const rows = users.volunteers.filter((v) =>
    q
      ? v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q)
      : true,
  );

  void emergencies;

  return (
    <div>
      <SectionHeading
        title={`Volunteers (${rows.length})`}
        subtitle="Trained neighbours paged for nearby emergencies."
      />
      <UserListCard
        rows={rows.map((v) => ({
          id: v.id,
          name: v.name,
          email: v.email,
          createdAt: v.createdAt,
          disabled: v.disabled,
          verified: v.verified,
          emailVerified: v.emailVerified,
          extra: v.skills ? `Skills: ${v.skills}` : "No skills listed",
          editable: {
            id: v.id,
            name: v.name,
            email: v.email,
            skills: v.skills ?? "",
          },
        }))}
        role="volunteer"
        scope={scope}
        canDisable={canManage}
        canDelete={canManage}
        canVerify
      />
    </div>
  );
}

/* ───────────── Vulnerable ───────────── */

function VulnerableSection({
  users,
  emergencies,
  search,
  scope,
  canManage,
}: {
  users: AdminUsersOverview;
  emergencies: Emergency[];
  search: string;
  scope: "admin" | "reviewer";
  canManage: boolean;
}) {
  const q = search.trim().toLowerCase();
  const rows = users.vulnerables.filter((v) =>
    q
      ? v.name.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q)
      : true,
  );

  void emergencies;

  return (
    <div>
      <SectionHeading
        title={`Vulnerable residents (${rows.length})`}
        subtitle="People we look after. SOS calls page nearby volunteers."
      />
      <UserListCard
        rows={rows.map((v) => ({
          id: v.id,
          name: v.name,
          email: v.email,
          createdAt: v.createdAt,
          disabled: v.disabled,
          verified: v.verified,
          emailVerified: v.emailVerified,
          extra: `${v.address} · NOK ${v.nokName} (${v.nokRelation})`,
          editable: {
            id: v.id,
            name: v.name,
            email: v.email,
            address: v.address,
            nokName: v.nokName,
            nokRelation: v.nokRelation,
            nokContact: v.nokContact,
          },
        }))}
        role="vulnerable"
        scope={scope}
        canDisable={canManage}
        canDelete={canManage}
        canVerify
      />
    </div>
  );
}

/* ───────────── Activate emergency ───────────── */

function ActivateEmergencyCard() {
  const qc = useQueryClient();
  const [type, setType] = useState<"major" | "minor">("major");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const create = useMutation({
    mutationFn: () =>
      createEmergency(
        {
          type,
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
      qc.invalidateQueries({ queryKey: EMERG_KEY });
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
            `Could not activate ${type} emergency.`,
        ),
    });
  }

  return (
    <section className="bg-white border-2 border-[hsl(var(--primary))]/30 rounded-2xl p-6 shadow-sm">
      <SectionHeading
        title="Activate emergency"
        subtitle="Major pages every volunteer in the affected area. Minor is a quieter call-out — use for non-critical assistance."
      />
      <div className="flex gap-2 mb-4">
        {(["major", "minor"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-semibold capitalize transition ${
              type === t
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))]"
                : "border-stone-200 text-stone-600 hover:border-stone-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <textarea
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder={
            type === "major"
              ? "e.g. Block-wide kitchen fire reported at Blk 207 Jln Besar"
              : "e.g. Elderly resident needs help getting up, no injuries"
          }
          className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
        />
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Address (optional)"
          className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
        />
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
            {type === "major" ? "Major" : "Minor"} emergency activated and broadcast.
          </p>
        )}
        <button
          type="submit"
          disabled={create.isPending}
          className="inline-flex items-center gap-2 bg-[hsl(var(--primary))] text-white rounded-lg px-5 py-2.5 font-semibold hover:opacity-90 disabled:opacity-60"
        >
          {create.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Siren className="w-4 h-4" />
          )}
          Activate {type === "major" ? "Major" : "Minor"}
        </button>
      </form>
    </section>
  );
}

/* ───────────── Live emergencies ───────────── */

function EmergenciesSection({
  emergencies,
  canDeactivate,
}: {
  emergencies: Emergency[];
  canDeactivate: boolean;
}) {
  const qc = useQueryClient();
  const deactivate = useMutation({
    mutationFn: (id: number) => deactivateEmergency(id, { credentials: "include" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMERG_KEY }),
  });

  const volunteerLocs = useQuery({
    queryKey: ["/api/admin/volunteer-locations"] as const,
    queryFn: () => adminListVolunteerLocations({ credentials: "include" }),
    refetchInterval: 8_000,
  });
  const volunteers = volunteerLocs.data?.volunteers ?? [];

  const [tab, setTab] = useState<"active" | "history">("active");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const active = emergencies.filter((e) => e.status === "active");
  const history = emergencies.filter((e) => e.status !== "active");

  const visible = tab === "active" ? active : history;

  // Reset selection if it leaves the active list (e.g., deactivated).
  useEffect(() => {
    if (selectedId == null) return;
    if (!active.some((e) => e.id === selectedId)) setSelectedId(null);
  }, [active, selectedId]);

  const selectedSummary = active.find((e) => e.id === selectedId) ?? null;

  return (
    <div>
      <SectionHeading
        title={`Emergencies (${emergencies.length})`}
        subtitle={`Real-time view of every SOS call across the network. ${volunteers.length} volunteer${volunteers.length === 1 ? "" : "s"} live on the map.`}
      />
      <div className="mb-4">
        <EmergencyMap
          emergencies={emergencies}
          volunteerLocations={volunteers}
          routeToEmergencyId={selectedId}
          height={360}
        />
        {selectedSummary && (
          <div className="mt-2 flex items-center justify-between text-xs bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
            <span className="text-stone-700">
              Showing walking routes from {volunteers.length} volunteer
              {volunteers.length === 1 ? "" : "s"} to{" "}
              <span className="font-semibold">
                {selectedSummary.type === "major" ? "Major" : "Minor"} ·{" "}
                {selectedSummary.creatorName}
              </span>
              {selectedSummary.address ? ` (${selectedSummary.address})` : ""}.
            </span>
            <button
              onClick={() => setSelectedId(null)}
              className="text-stone-600 hover:text-stone-900 font-semibold"
            >
              Clear routes
            </button>
          </div>
        )}
      </div>

      <div className="mb-3 inline-flex rounded-lg border border-stone-200 bg-white p-1 text-xs font-semibold">
        <button
          onClick={() => setTab("active")}
          className={`px-3 py-1.5 rounded-md ${tab === "active" ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"}`}
        >
          Active ({active.length})
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-3 py-1.5 rounded-md ${tab === "history" ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"}`}
        >
          History ({history.length})
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {visible.length === 0 ? (
          <p className="px-6 py-8 text-sm text-stone-500">
            {tab === "active"
              ? "No active emergencies right now."
              : "No deactivated or resolved emergencies yet."}
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {visible.map((e) => {
              const isActive = e.status === "active";
              const isSelected = selectedId === e.id;
              return (
                <li
                  key={e.id}
                  onClick={
                    isActive ? () => setSelectedId(isSelected ? null : e.id) : undefined
                  }
                  className={`px-6 py-4 flex flex-wrap items-start justify-between gap-4 ${
                    isActive ? "cursor-pointer" : ""
                  } ${
                    isSelected
                      ? "bg-amber-50 border-l-4 border-l-[hsl(var(--primary))]"
                      : isActive
                        ? "hover:bg-stone-50"
                        : ""
                  }`}
                >
                  <div className="text-sm flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isActive ? (
                        <StatusBadge
                          kind={e.type === "major" ? "live-major" : "live-minor"}
                        />
                      ) : (
                        <StatusBadge kind={e.status as "deactivated" | "resolved"} />
                      )}
                      <span className="font-semibold text-stone-900">{e.creatorName}</span>
                      <span className="text-xs text-stone-500">({e.creatorRole})</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--primary))]">
                          Routes shown
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 mt-1">
                      {e.address || "Unknown address"}
                      {e.lat && e.lng && (
                        <span className="font-mono ml-2">
                          ({e.lat.toFixed(4)}, {e.lng.toFixed(4)})
                        </span>
                      )}
                    </p>
                    {e.description && (
                      <p className="text-xs text-stone-700 mt-1">{e.description}</p>
                    )}
                    {e.responseStats && (
                      <p className="text-xs text-stone-500 mt-1">
                        {e.responseStats.accepted} accepted · {e.responseStats.arrived} arrived ·{" "}
                        {e.responseStats.declined} declined
                      </p>
                    )}
                  </div>
                  {canDeactivate && isActive && (
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        deactivate.mutate(e.id);
                      }}
                      disabled={deactivate.isPending}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold border border-red-300 text-red-700 rounded-md px-3 py-1.5 hover:bg-red-50 disabled:opacity-60"
                    >
                      <PowerOff className="w-3.5 h-3.5" />
                      Deactivate
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ───────────── Staff (admin-only) ───────────── */

function StaffSection({
  users,
  currentAdminId,
}: {
  users: AdminUsersOverview;
  currentAdminId: number;
}) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-8">
      <SectionHeading
        title="Staff accounts"
        subtitle="Admins and Reviewers. These roles aren't self-registerable."
        action={
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold bg-[hsl(var(--primary))] text-white rounded-lg px-3 py-2 hover:opacity-90"
          >
            <Plus className="w-4 h-4" />
            {showCreate ? "Close" : "Add staff"}
          </button>
        }
      />

      {showCreate && <CreateStaffForm onCreated={() => setShowCreate(false)} />}

      <UserListCard
        rows={users.admins.map((a) => ({
          id: a.id,
          name: a.name,
          email: a.email,
          createdAt: a.createdAt,
          disabled: a.disabled,
          isSelf: a.id === currentAdminId,
          extra: "Admin · full oversight",
          editable: { id: a.id, name: a.name, email: a.email },
        }))}
        role="admin"
        scope="admin"
        canDisable
        canDelete
      />
      <UserListCard
        rows={users.reviewers.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          createdAt: r.createdAt,
          disabled: r.disabled,
          extra: "Reviewer · verifies residents, activates Major emergencies",
          editable: { id: r.id, name: r.name, email: r.email },
        }))}
        role="reviewer"
        scope="admin"
        canDisable
        canDelete
      />
    </div>
  );
}

function CreateStaffForm({ onCreated }: { onCreated: () => void }) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminCreateUserRequest["role"]>("reviewer");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<AdminCreatedUser | null>(null);

  const create = useMutation({
    mutationFn: (body: AdminCreateUserRequest) =>
      adminCreateUser(body, { credentials: "include" }),
    onSuccess: (u) => {
      setCreated(u);
      setEmail("");
      setName("");
      setPassword("");
      qc.invalidateQueries({ queryKey: USERS_KEY });
      setTimeout(onCreated, 1500);
    },
    onError: (err) =>
      setError(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not create user.",
      ),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    create.mutate({ email, password, name, role });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm grid sm:grid-cols-2 gap-4"
    >
      <div className="sm:col-span-2 grid grid-cols-2 gap-3">
        {(["reviewer", "admin"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={`text-left p-3 rounded-lg border-2 capitalize ${
              role === r
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                : "border-stone-200 hover:border-stone-300"
            }`}
          >
            <div className="font-semibold text-stone-900">{r}</div>
            <div className="text-xs text-stone-600 mt-0.5">
              {r === "reviewer"
                ? "Verifies residents, activates Major emergencies."
                : "Full oversight — manage staff & emergencies."}
            </div>
          </button>
        ))}
      </div>
      <input
        type="text"
        required
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
      />
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
      />
      <input
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        placeholder="Initial password (8+ chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="sm:col-span-2 rounded-lg border border-stone-200 px-3 py-2 font-mono focus:outline-none focus:border-[hsl(var(--primary))]"
      />
      {error && (
        <p className="sm:col-span-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {created && (
        <div className="sm:col-span-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Created <strong className="ml-1">{created.role}</strong>{" "}
          <span className="font-mono ml-1">{created.email}</span>
        </div>
      )}
      <button
        type="submit"
        disabled={create.isPending}
        className="sm:col-span-2 bg-[hsl(var(--primary))] text-white rounded-lg py-2.5 font-medium hover:opacity-90 disabled:opacity-60"
      >
        {create.isPending ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}

/* ───────────── Shared user list card ───────────── */

interface ListRow {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  disabled: boolean;
  verified?: boolean;
  emailVerified?: boolean;
  isSelf?: boolean;
  extra: string;
  editable: EditableRow;
}

function UserListCard({
  rows,
  role,
  scope,
  canDisable,
  canDelete,
  canVerify,
}: {
  rows: ListRow[];
  role: EditableUserRole;
  scope: "admin" | "reviewer";
  canDisable?: boolean;
  canDelete?: boolean;
  canVerify?: boolean;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ListRow | null>(null);
  const [confirm, setConfirm] = useState<ListRow | null>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const invalidateKey = scope === "admin" ? USERS_KEY : (["/api/reviewer/users-overview"] as const);

  const disableM = useMutation({
    mutationFn: (id: number) =>
      adminDisableUser(role as ManagedUserRole, id, { credentials: "include" }),
    onSuccess: () => {
      setMsg({ kind: "ok", text: "Account disabled." });
      qc.invalidateQueries({ queryKey: invalidateKey });
    },
    onError: (err) =>
      setMsg({
        kind: "err",
        text:
          (err as { data?: { message?: string } })?.data?.message ??
          "Could not disable.",
      }),
  });
  const enableM = useMutation({
    mutationFn: (id: number) =>
      adminEnableUser(role as ManagedUserRole, id, { credentials: "include" }),
    onSuccess: () => {
      setMsg({ kind: "ok", text: "Account enabled." });
      qc.invalidateQueries({ queryKey: invalidateKey });
    },
  });
  const deleteM = useMutation({
    mutationFn: (id: number) =>
      adminDeleteUser(role as ManagedUserRole, id, { credentials: "include" }),
    onSuccess: () => {
      setMsg({ kind: "ok", text: "Account removed." });
      setConfirm(null);
      qc.invalidateQueries({ queryKey: invalidateKey });
    },
    onError: (err) =>
      setMsg({
        kind: "err",
        text:
          (err as { data?: { message?: string } })?.data?.message ??
          "Could not delete.",
      }),
  });
  const verifyM = useMutation({
    mutationFn: (id: number) => {
      const fn = role === "volunteer" ? verifyVolunteer : verifyVulnerable;
      return fn(id, { credentials: "include" });
    },
    onSuccess: () => {
      setMsg({ kind: "ok", text: "Account verified." });
      qc.invalidateQueries({ queryKey: invalidateKey });
    },
  });

  const showVerify = canVerify && (role === "volunteer" || role === "vulnerable");

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      {msg && (
        <div
          className={`px-6 py-3 text-sm border-b ${
            msg.kind === "ok"
              ? "bg-green-50 text-green-800 border-green-100"
              : "bg-red-50 text-red-700 border-red-100"
          }`}
        >
          {msg.text}
        </div>
      )}
      {rows.length === 0 ? (
        <p className="px-6 py-8 text-sm text-stone-500">No accounts to show.</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {rows.map((r) => (
            <li
              key={r.id}
              className="px-6 py-4 flex flex-wrap items-start justify-between gap-4"
            >
              <div className="text-sm flex-1 min-w-[260px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-stone-900">{r.name}</span>
                  <span className="text-stone-500 font-mono text-xs">{r.email}</span>
                  {r.disabled && <StatusBadge kind="disabled" />}
                  {r.verified === true && <StatusBadge kind="verified" />}
                  {r.verified === false && <StatusBadge kind="pending" />}
                  {r.emailVerified === false && <StatusBadge kind="email-unverified" />}
                  {r.isSelf && (
                    <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      You
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  ID #{r.id} · Joined {new Date(r.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-stone-600 mt-1">{r.extra}</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {showVerify && r.verified === false && (
                  <button
                    onClick={() => verifyM.mutate(r.id)}
                    disabled={verifyM.isPending}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold border border-green-300 text-green-700 rounded-md px-3 py-1.5 hover:bg-green-50 disabled:opacity-40"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Verify
                  </button>
                )}
                <button
                  onClick={() => setEditing(r)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold border border-stone-300 text-stone-700 rounded-md px-3 py-1.5 hover:bg-stone-50"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                {canDisable &&
                  (r.disabled ? (
                    <button
                      onClick={() => enableM.mutate(r.id)}
                      disabled={enableM.isPending}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold border border-green-300 text-green-700 rounded-md px-3 py-1.5 hover:bg-green-50 disabled:opacity-40"
                    >
                      <Power className="w-3.5 h-3.5" />
                      Enable
                    </button>
                  ) : (
                    <button
                      onClick={() => disableM.mutate(r.id)}
                      disabled={disableM.isPending || r.isSelf}
                      title={r.isSelf ? "You cannot disable yourself" : ""}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold border border-stone-300 text-stone-700 rounded-md px-3 py-1.5 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      Disable
                    </button>
                  ))}
                {canDelete && (
                  <button
                    onClick={() => setConfirm(r)}
                    disabled={r.isSelf}
                    title={r.isSelf ? "You cannot delete yourself" : ""}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold border border-red-300 text-red-700 rounded-md px-3 py-1.5 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <UserEditModal
          scope={scope}
          role={role}
          row={editing.editable}
          invalidateKey={invalidateKey}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setMsg({ kind: "ok", text: "Account updated." });
          }}
        />
      )}

      {confirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
              Delete {role} account?
            </h3>
            <p className="text-sm text-stone-700 mb-4">
              This permanently removes{" "}
              <span className="font-mono">{confirm.email}</span>. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirm(null)}
                className="text-sm px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteM.mutate(confirm.id)}
                disabled={deleteM.isPending}
                className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteM.isPending ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
