import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import {
  Activity,
  ShieldCheck,
  Users,
  Heart,
  AlertTriangle,
  Pencil,
  CheckCircle2,
  Loader2,
  MapPin,
  Siren,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  reviewerListUsers,
  verifyVolunteer,
  verifyVulnerable,
  listEmergencies,
  createEmergency,
  adminListVolunteerLocations,
  type Emergency,
  type ReviewerUsersOverview,
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
} from "@/components/user-edit-modal";
import { EmergencyMap } from "@/components/emergency-map";

const USERS_KEY = ["/api/reviewer/users-overview"] as const;
const EMERG_KEY = ["/api/emergencies"] as const;

type SectionKey =
  | "overview"
  | "verifications"
  | "volunteers"
  | "vulnerable"
  | "emergencies";

const SECTIONS: SectionDef<SectionKey>[] = [
  { key: "overview", label: "Overview", icon: Activity },
  { key: "verifications", label: "Verifications", icon: ShieldCheck },
  { key: "volunteers", label: "Volunteers", icon: Users },
  { key: "vulnerable", label: "Vulnerable", icon: Heart },
  { key: "emergencies", label: "Live emergencies", icon: AlertTriangle },
];

export default function ReviewerPage() {
  const me = useMe();
  const logout = useLogout();
  const [, navigate] = useLocation();
  const [section, setSection] = useState<SectionKey>("overview");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (me.isLoading) return;
    if (!me.data) navigate("/login");
    else if (me.data.role !== "reviewer" && me.data.role !== "admin") {
      navigate("/dashboard");
    } else if (me.data.role === "admin") {
      navigate("/admin");
    }
  }, [me.isLoading, me.data, navigate]);

  const overview = useQuery({
    queryKey: USERS_KEY,
    queryFn: () => reviewerListUsers({ credentials: "include" }),
    enabled: me.data?.role === "reviewer",
  });
  const emergencies = useQuery({
    queryKey: EMERG_KEY,
    queryFn: () => listEmergencies({ credentials: "include" }),
    enabled: me.data?.role === "reviewer",
    refetchInterval: 8_000,
  });

  if (me.isLoading || !me.data || me.data.role !== "reviewer") {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center">
        <p className="text-stone-500">Loading…</p>
      </div>
    );
  }

  return (
    <DashShell
      brand="Fire Kaki Reviewer"
      sections={SECTIONS}
      active={section}
      onSectionChange={(k) => setSection(k)}
      search={search}
      onSearchChange={setSearch}
      onSignOut={() =>
        logout.mutate(undefined, { onSuccess: () => navigate("/") })
      }
    >
      <ReviewerContent
        section={section}
        search={search}
        users={overview.data}
        usersLoading={overview.isLoading}
        emergencies={emergencies.data?.emergencies ?? []}
      />
    </DashShell>
  );
}

function ReviewerContent({
  section,
  search,
  users,
  usersLoading,
  emergencies,
}: {
  section: SectionKey;
  search: string;
  users: ReviewerUsersOverview | undefined;
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
    return <VerificationsSection users={users} search={search} />;
  }
  if (section === "volunteers") {
    return <VolunteersSection users={users} search={search} />;
  }
  if (section === "vulnerable") {
    return <VulnerableSection users={users} search={search} />;
  }
  return <EmergenciesSection emergencies={emergencies} />;
}

/* ───────────── Overview ───────────── */

function OverviewSection({
  stats,
  users,
  emergencies,
  search,
}: {
  stats: { verified: number; activeVols: number; live: number; coverage: number };
  users: ReviewerUsersOverview;
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
}: {
  users: ReviewerUsersOverview;
  search: string;
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

/* ───────────── Volunteers / Vulnerable list (reviewer scope: verify + edit only) ───────────── */

function VolunteersSection({
  users,
  search,
}: {
  users: ReviewerUsersOverview;
  search: string;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ id: number; row: EditableRow } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const verify = useMutation({
    mutationFn: (id: number) => verifyVolunteer(id, { credentials: "include" }),
    onSuccess: () => {
      setMsg("Volunteer verified.");
      qc.invalidateQueries({ queryKey: USERS_KEY });
    },
  });

  const q = search.trim().toLowerCase();
  const rows = users.volunteers.filter((v) =>
    q ? v.name.toLowerCase().includes(q) || v.email.toLowerCase().includes(q) : true,
  );

  return (
    <div>
      <SectionHeading
        title={`Volunteers (${rows.length})`}
        subtitle="Verify trained neighbours and keep their details current."
      />
      {msg && (
        <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {msg}
        </p>
      )}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-6 py-8 text-sm text-stone-500">No volunteers to show.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {rows.map((v) => (
              <li
                key={v.id}
                className="px-6 py-4 flex flex-wrap items-start justify-between gap-4"
              >
                <div className="text-sm flex-1 min-w-[260px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-stone-900">{v.name}</span>
                    <span className="text-stone-500 font-mono text-xs">{v.email}</span>
                    {v.disabled && <StatusBadge kind="disabled" />}
                    {v.verified ? (
                      <StatusBadge kind="verified" />
                    ) : (
                      <StatusBadge kind="pending" />
                    )}
                    {!v.emailVerified && <StatusBadge kind="email-unverified" />}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    ID #{v.id} · Joined {new Date(v.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-stone-600 mt-1">
                    {v.skills ? `Skills: ${v.skills}` : "No skills listed"}
                    {v.lastSeenAt && (
                      <> · Last seen {new Date(v.lastSeenAt).toLocaleString()}</>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {!v.verified && (
                    <button
                      onClick={() => verify.mutate(v.id)}
                      disabled={verify.isPending}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold border border-green-300 text-green-700 rounded-md px-3 py-1.5 hover:bg-green-50 disabled:opacity-40"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setEditing({
                        id: v.id,
                        row: {
                          id: v.id,
                          name: v.name,
                          email: v.email,
                          skills: v.skills ?? "",
                        },
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-semibold border border-stone-300 text-stone-700 rounded-md px-3 py-1.5 hover:bg-stone-50"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <UserEditModal
          scope="reviewer"
          role="volunteer"
          row={editing.row}
          invalidateKey={USERS_KEY}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setMsg("Account updated.");
          }}
        />
      )}
    </div>
  );
}

function VulnerableSection({
  users,
  search,
}: {
  users: ReviewerUsersOverview;
  search: string;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<{ id: number; row: EditableRow } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const verify = useMutation({
    mutationFn: (id: number) => verifyVulnerable(id, { credentials: "include" }),
    onSuccess: () => {
      setMsg("Vulnerable verified.");
      qc.invalidateQueries({ queryKey: USERS_KEY });
    },
  });

  const q = search.trim().toLowerCase();
  const rows = users.vulnerables.filter((v) =>
    q
      ? v.name.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q)
      : true,
  );

  return (
    <div>
      <SectionHeading
        title={`Vulnerable residents (${rows.length})`}
        subtitle="Verify residents and keep their details current."
      />
      {msg && (
        <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          {msg}
        </p>
      )}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <p className="px-6 py-8 text-sm text-stone-500">No residents to show.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {rows.map((v) => (
              <li
                key={v.id}
                className="px-6 py-4 flex flex-wrap items-start justify-between gap-4"
              >
                <div className="text-sm flex-1 min-w-[260px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-stone-900">{v.name}</span>
                    <span className="text-stone-500 font-mono text-xs">{v.email}</span>
                    {v.disabled && <StatusBadge kind="disabled" />}
                    {v.verified ? (
                      <StatusBadge kind="verified" />
                    ) : (
                      <StatusBadge kind="pending" />
                    )}
                    {!v.emailVerified && <StatusBadge kind="email-unverified" />}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    ID #{v.id} · Joined {new Date(v.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-stone-600 mt-1">
                    {v.address} · NOK {v.nokName} ({v.nokRelation}) · {v.nokContact}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {!v.verified && (
                    <button
                      onClick={() => verify.mutate(v.id)}
                      disabled={verify.isPending}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold border border-green-300 text-green-700 rounded-md px-3 py-1.5 hover:bg-green-50 disabled:opacity-40"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verify
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setEditing({
                        id: v.id,
                        row: {
                          id: v.id,
                          name: v.name,
                          email: v.email,
                          address: v.address,
                          nokName: v.nokName,
                          nokRelation: v.nokRelation,
                          nokContact: v.nokContact,
                        },
                      })
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-semibold border border-stone-300 text-stone-700 rounded-md px-3 py-1.5 hover:bg-stone-50"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <UserEditModal
          scope="reviewer"
          role="vulnerable"
          row={editing.row}
          invalidateKey={USERS_KEY}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setMsg("Account updated.");
          }}
        />
      )}
    </div>
  );
}

/* ───────────── Live emergencies (reviewer scope: read-only + activate Major) ───────────── */

function EmergenciesSection({ emergencies }: { emergencies: Emergency[] }) {
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

  useEffect(() => {
    if (selectedId == null) return;
    if (!active.some((e) => e.id === selectedId)) setSelectedId(null);
  }, [active, selectedId]);

  const selectedSummary = active.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="space-y-8">
      <ActivateMajorCard />
      <div>
        <SectionHeading
          title={`Emergencies (${emergencies.length})`}
          subtitle={`Read-only roster of every SOS call. ${volunteers.length} volunteer${volunteers.length === 1 ? "" : "s"} live on the map. Activate a Major emergency above to page volunteers.`}
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
                      isActive
                        ? () => setSelectedId(isSelected ? null : e.id)
                        : undefined
                    }
                    className={`px-6 py-4 ${isActive ? "cursor-pointer" : ""} ${
                      isSelected
                        ? "bg-amber-50 border-l-4 border-l-[hsl(var(--primary))]"
                        : isActive
                          ? "hover:bg-stone-50"
                          : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 flex-wrap text-sm">
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

function ActivateMajorCard() {
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
            "Could not activate major emergency.",
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
