import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import {
  Flame,
  ArrowLeft,
  ShieldPlus,
  CheckCircle2,
  Power,
  Trash2,
  UserX,
  Pencil,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminCreateUser,
  adminListAllUsers,
  adminDisableUser,
  adminEnableUser,
  adminDeleteUser,
  adminUpdateUser,
  type AdminCreateUserRequest,
  type AdminUpdateUserRequest,
  type AdminCreatedUser,
  type Role,
} from "@workspace/api-client-react";
import { useMe, useLogout } from "@/lib/auth";

const USERS_KEY = ["/api/admin/users-overview"] as const;

export default function AdminPage() {
  const me = useMe();
  const logout = useLogout();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (me.isLoading) return;
    if (!me.data) navigate("/login");
    else if (me.data.role !== "admin") navigate("/dashboard");
  }, [me.isLoading, me.data, navigate]);

  if (me.isLoading || !me.data || me.data.role !== "admin") {
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

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--primary))] mb-2">
            Admin · User management
          </p>
          <h1 className="font-serif text-4xl font-bold text-stone-900">Manage users</h1>
          <p className="text-stone-600 mt-3">
            Full oversight across every vault. Add Reviewers and Admins, disable accounts that
            shouldn't sign in, or remove them permanently.
          </p>
        </div>

        <CreateUserForm />
        <UserVaults currentAdminId={me.data.id} />
      </main>
    </div>
  );
}

/* ─────────── Create reviewer/admin form ─────────── */

function CreateUserForm() {
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
    onSuccess: () => qc.invalidateQueries({ queryKey: USERS_KEY }),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreated(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    create.mutate(
      { email, password, name, role },
      {
        onSuccess: (u) => {
          setCreated(u);
          setEmail("");
          setName("");
          setPassword("");
        },
        onError: (err) =>
          setError(
            (err as { data?: { message?: string } })?.data?.message ??
              "Could not create user",
          ),
      },
    );
  }

  return (
    <section className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] flex items-center justify-center shrink-0">
          <ShieldPlus className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-serif text-2xl font-bold text-stone-900">
            Create Reviewer or Admin
          </h2>
          <p className="text-sm text-stone-600 mt-1">
            These roles aren't self-registerable. New accounts can sign in immediately.
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-4">
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
                  ? "Verifies vulnerable profiles, activates Major emergencies."
                  : "Full oversight — can deactivate emergencies and manage users."}
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
          <div className="sm:col-span-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Created <strong>{created.role}</strong>{" "}
              <span className="font-mono">{created.email}</span> (id {created.id}).
            </span>
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
    </section>
  );
}

/* ─────────── 4-vault user tables ─────────── */

const TABS: { role: Role; label: string }[] = [
  { role: "admin", label: "Admins" },
  { role: "reviewer", label: "Reviewers" },
  { role: "volunteer", label: "Volunteers" },
  { role: "vulnerable", label: "Vulnerable" },
];

type EditTarget =
  | { role: "admin"; row: Overview["admins"][number] }
  | { role: "reviewer"; row: Overview["reviewers"][number] }
  | { role: "volunteer"; row: Overview["volunteers"][number] }
  | { role: "vulnerable"; row: Overview["vulnerables"][number] };

function UserVaults({ currentAdminId }: { currentAdminId: number }) {
  const qc = useQueryClient();
  const [active, setActive] = useState<Role>("admin");
  const [confirmDelete, setConfirmDelete] = useState<{ role: Role; id: number; email: string } | null>(null);
  const [editing, setEditing] = useState<EditTarget | null>(null);
  const [actionMsg, setActionMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const list = useQuery({
    queryKey: USERS_KEY,
    queryFn: () => adminListAllUsers({ credentials: "include" }),
  });

  function refresh() {
    qc.invalidateQueries({ queryKey: USERS_KEY });
  }

  const disable = useMutation({
    mutationFn: ({ role, id }: { role: Role; id: number }) =>
      adminDisableUser(role, id, { credentials: "include" }),
    onSuccess: () => {
      setActionMsg({ kind: "ok", text: "Account disabled." });
      refresh();
    },
    onError: (err) =>
      setActionMsg({
        kind: "err",
        text:
          (err as { data?: { message?: string } })?.data?.message ??
          "Could not disable.",
      }),
  });
  const enableM = useMutation({
    mutationFn: ({ role, id }: { role: Role; id: number }) =>
      adminEnableUser(role, id, { credentials: "include" }),
    onSuccess: () => {
      setActionMsg({ kind: "ok", text: "Account re-enabled." });
      refresh();
    },
  });
  const del = useMutation({
    mutationFn: ({ role, id }: { role: Role; id: number }) =>
      adminDeleteUser(role, id, { credentials: "include" }),
    onSuccess: () => {
      setActionMsg({ kind: "ok", text: "Account removed." });
      setConfirmDelete(null);
      refresh();
    },
    onError: (err) =>
      setActionMsg({
        kind: "err",
        text:
          (err as { data?: { message?: string } })?.data?.message ??
          "Could not delete.",
      }),
  });

  const data = list.data;
  const counts = data
    ? {
        admin: data.admins.length,
        reviewer: data.reviewers.length,
        volunteer: data.volunteers.length,
        vulnerable: data.vulnerables.length,
      }
    : { admin: 0, reviewer: 0, volunteer: 0, vulnerable: 0 };

  return (
    <section className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="border-b border-stone-200 px-6 py-4">
        <h2 className="font-serif text-2xl font-bold text-stone-900">All accounts</h2>
        <p className="text-sm text-stone-600 mt-1">
          Disabling blocks sign-in immediately. Deleting is permanent.
        </p>
      </div>

      <div className="flex border-b border-stone-200 bg-stone-50">
        {TABS.map((t) => (
          <button
            key={t.role}
            onClick={() => {
              setActive(t.role);
              setActionMsg(null);
            }}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition ${
              active === t.role
                ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))] bg-white"
                : "border-transparent text-stone-600 hover:text-stone-900"
            }`}
          >
            {t.label}{" "}
            <span className="ml-1 text-xs text-stone-500">({counts[t.role]})</span>
          </button>
        ))}
      </div>

      {actionMsg && (
        <div
          className={`mx-6 mt-4 text-sm rounded-lg px-3 py-2 ${
            actionMsg.kind === "ok"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {actionMsg.text}
        </div>
      )}

      <div className="p-6">
        {list.isLoading ? (
          <p className="text-sm text-stone-500">Loading…</p>
        ) : !data ? (
          <p className="text-sm text-red-600">Could not load users.</p>
        ) : (
          <UserTable
            role={active}
            data={data}
            currentAdminId={currentAdminId}
            onDisable={(id) => disable.mutate({ role: active, id })}
            onEnable={(id) => enableM.mutate({ role: active, id })}
            onDelete={(id, email) => setConfirmDelete({ role: active, id, email })}
            onEdit={(target) => setEditing(target)}
            busy={disable.isPending || enableM.isPending}
          />
        )}
      </div>

      {editing && (
        <EditUserModal
          target={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            setActionMsg({ kind: "ok", text: "Account updated." });
            refresh();
          }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="font-serif text-xl font-bold text-stone-900 mb-2">
              Delete {confirmDelete.role} account?
            </h3>
            <p className="text-sm text-stone-700 mb-4">
              This permanently removes <span className="font-mono">{confirmDelete.email}</span>{" "}
              from the {confirmDelete.role}_users vault. This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="text-sm px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  del.mutate({ role: confirmDelete.role, id: confirmDelete.id })
                }
                disabled={del.isPending}
                className="text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {del.isPending ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

type Overview = NonNullable<ReturnType<typeof useQuery<Awaited<ReturnType<typeof adminListAllUsers>>>>["data"]>;

function UserTable({
  role,
  data,
  currentAdminId,
  onDisable,
  onEnable,
  onDelete,
  onEdit,
  busy,
}: {
  role: Role;
  data: Overview;
  currentAdminId: number;
  onDisable: (id: number) => void;
  onEnable: (id: number) => void;
  onDelete: (id: number, email: string) => void;
  onEdit: (target: EditTarget) => void;
  busy: boolean;
}) {
  const rows: Array<{
    id: number;
    name: string;
    email: string;
    disabled: boolean;
    createdAt: string;
    extra?: React.ReactNode;
  }> = [];

  if (role === "admin") {
    data.admins.forEach((a) =>
      rows.push({
        id: a.id,
        name: a.name,
        email: a.email,
        disabled: a.disabled,
        createdAt: a.createdAt,
      }),
    );
  } else if (role === "reviewer") {
    data.reviewers.forEach((r) =>
      rows.push({
        id: r.id,
        name: r.name,
        email: r.email,
        disabled: r.disabled,
        createdAt: r.createdAt,
      }),
    );
  } else if (role === "volunteer") {
    data.volunteers.forEach((v) =>
      rows.push({
        id: v.id,
        name: v.name,
        email: v.email,
        disabled: v.disabled,
        createdAt: v.createdAt,
        extra: (
          <div className="text-xs text-stone-600 space-y-0.5">
            {v.skills && <div>Skills: {v.skills}</div>}
            <div>
              GPS consent: {v.gpsConsent ? "yes" : "no"} · Email{" "}
              {v.emailVerified ? "verified" : "unverified"}
            </div>
            {v.lastSeenAt && (
              <div>Last seen: {new Date(v.lastSeenAt).toLocaleString()}</div>
            )}
          </div>
        ),
      }),
    );
  } else {
    data.vulnerables.forEach((v) =>
      rows.push({
        id: v.id,
        name: v.name,
        email: v.email,
        disabled: v.disabled,
        createdAt: v.createdAt,
        extra: (
          <div className="text-xs text-stone-600 space-y-0.5">
            <div>{v.address}</div>
            <div>
              NOK: {v.nokName} ({v.nokRelation}) · {v.nokContact}
            </div>
            <div>
              {v.verified ? "Verified" : "Awaiting verification"} · Email{" "}
              {v.emailVerified ? "verified" : "unverified"}
            </div>
          </div>
        ),
      }),
    );
  }

  if (rows.length === 0) {
    return <p className="text-sm text-stone-500">No {role} accounts yet.</p>;
  }

  return (
    <ul className="divide-y divide-stone-200">
      {rows.map((r) => {
        const isSelf = role === "admin" && r.id === currentAdminId;
        return (
          <li
            key={r.id}
            className="py-4 flex flex-wrap items-start justify-between gap-4"
          >
            <div className="text-sm flex-1 min-w-[240px]">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-stone-900">{r.name}</p>
                <span className="text-stone-500 font-mono text-xs">{r.email}</span>
                {r.disabled && (
                  <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                    Disabled
                  </span>
                )}
                {isSelf && (
                  <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                    You
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                ID #{r.id} · Joined {new Date(r.createdAt).toLocaleDateString()}
              </p>
              {r.extra && <div className="mt-1.5">{r.extra}</div>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (role === "admin") {
                    const row = data.admins.find((x) => x.id === r.id);
                    if (row) onEdit({ role: "admin", row });
                  } else if (role === "reviewer") {
                    const row = data.reviewers.find((x) => x.id === r.id);
                    if (row) onEdit({ role: "reviewer", row });
                  } else if (role === "volunteer") {
                    const row = data.volunteers.find((x) => x.id === r.id);
                    if (row) onEdit({ role: "volunteer", row });
                  } else {
                    const row = data.vulnerables.find((x) => x.id === r.id);
                    if (row) onEdit({ role: "vulnerable", row });
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold border border-stone-300 text-stone-700 rounded-md px-3 py-1.5 hover:bg-stone-50"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </button>
              {r.disabled ? (
                <button
                  onClick={() => onEnable(r.id)}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold border border-green-300 text-green-700 rounded-md px-3 py-1.5 hover:bg-green-50 disabled:opacity-60"
                >
                  <Power className="w-3.5 h-3.5" />
                  Enable
                </button>
              ) : (
                <button
                  onClick={() => onDisable(r.id)}
                  disabled={busy || isSelf}
                  title={isSelf ? "You cannot disable your own account" : ""}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold border border-stone-300 text-stone-700 rounded-md px-3 py-1.5 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <UserX className="w-3.5 h-3.5" />
                  Disable
                </button>
              )}
              <button
                onClick={() => onDelete(r.id, r.email)}
                disabled={isSelf}
                title={isSelf ? "You cannot delete your own account" : ""}
                className="inline-flex items-center gap-1.5 text-xs font-semibold border border-red-300 text-red-700 rounded-md px-3 py-1.5 hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ─────────── Edit user modal ─────────── */

function EditUserModal({
  target,
  onClose,
  onSaved,
}: {
  target: EditTarget;
  onClose: () => void;
  onSaved: () => void;
}) {
  const qc = useQueryClient();
  const r = target.row;
  const [name, setName] = useState(r.name);
  const [email, setEmail] = useState(r.email);
  const [password, setPassword] = useState("");
  const [skills, setSkills] = useState(
    target.role === "volunteer" ? target.row.skills ?? "" : "",
  );
  const [address, setAddress] = useState(
    target.role === "vulnerable" ? target.row.address : "",
  );
  const [nokName, setNokName] = useState(
    target.role === "vulnerable" ? target.row.nokName : "",
  );
  const [nokRelation, setNokRelation] = useState(
    target.role === "vulnerable" ? target.row.nokRelation : "",
  );
  const [nokContact, setNokContact] = useState(
    target.role === "vulnerable" ? target.row.nokContact : "",
  );
  const [error, setError] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: (body: AdminUpdateUserRequest) =>
      adminUpdateUser(target.role, r.id, body, { credentials: "include" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USERS_KEY });
      onSaved();
    },
    onError: (err) =>
      setError(
        (err as { data?: { message?: string } })?.data?.message ??
          "Could not update user.",
      ),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const body: AdminUpdateUserRequest = {};
    if (name.trim() !== r.name) body.name = name.trim();
    if (email.trim().toLowerCase() !== r.email) body.email = email.trim().toLowerCase();
    if (password.length > 0) body.password = password;
    if (target.role === "volunteer") {
      const orig = target.row.skills ?? "";
      if (skills !== orig) body.skills = skills.trim() || null;
    }
    if (target.role === "vulnerable") {
      if (address.trim() !== target.row.address) body.address = address.trim();
      if (nokName.trim() !== target.row.nokName) body.nokName = nokName.trim();
      if (nokRelation.trim() !== target.row.nokRelation) body.nokRelation = nokRelation.trim();
      if (nokContact.trim() !== target.row.nokContact) body.nokContact = nokContact.trim();
    }
    if (Object.keys(body).length === 0) {
      setError("No changes to save.");
      return;
    }
    update.mutate(body);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div>
          <h3 className="font-serif text-xl font-bold text-stone-900">
            Edit {target.role} account
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            ID #{r.id} · Leave password blank to keep current.
          </p>
        </div>

        <Field label="Full name">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-stone-200 px-3 py-2 font-mono focus:outline-none focus:border-[hsl(var(--primary))]"
          />
        </Field>

        <Field label="New password (optional)">
          <input
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep existing"
            className="w-full rounded-lg border border-stone-200 px-3 py-2 font-mono focus:outline-none focus:border-[hsl(var(--primary))]"
          />
        </Field>

        {target.role === "volunteer" && (
          <Field label="Skills">
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. CPR, First Aid"
              className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
            />
          </Field>
        )}

        {target.role === "vulnerable" && (
          <>
            <Field label="Address">
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Next-of-kin name">
                <input
                  type="text"
                  required
                  value={nokName}
                  onChange={(e) => setNokName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
                />
              </Field>
              <Field label="Relation">
                <input
                  type="text"
                  required
                  value={nokRelation}
                  onChange={(e) => setNokRelation(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
                />
              </Field>
            </div>
            <Field label="Next-of-kin contact">
              <input
                type="text"
                required
                value={nokContact}
                onChange={(e) => setNokContact(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 font-mono focus:outline-none focus:border-[hsl(var(--primary))]"
              />
            </Field>
          </>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg border border-stone-300 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={update.isPending}
            className="text-sm px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white hover:opacity-90 disabled:opacity-60"
          >
            {update.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
