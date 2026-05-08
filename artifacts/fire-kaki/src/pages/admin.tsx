import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Flame, ArrowLeft, ShieldPlus, CheckCircle2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import {
  adminCreateUser,
  type AdminCreateUserRequest,
  type AdminCreatedUser,
} from "@workspace/api-client-react";
import { useMe, useLogout } from "@/lib/auth";

export default function AdminPage() {
  const me = useMe();
  const logout = useLogout();
  const [, navigate] = useLocation();

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminCreateUserRequest["role"]>("reviewer");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<AdminCreatedUser | null>(null);

  const create = useMutation({
    mutationFn: (body: AdminCreateUserRequest) =>
      adminCreateUser(body, { credentials: "include" }),
  });

  useEffect(() => {
    if (me.isLoading) return;
    if (!me.data) {
      navigate("/login");
    } else if (me.data.role !== "admin") {
      navigate("/dashboard");
    }
  }, [me.isLoading, me.data, navigate]);

  if (me.isLoading || !me.data || me.data.role !== "admin") {
    return (
      <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center">
        <p className="text-stone-500">Loading…</p>
      </div>
    );
  }

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
        onError: (err) => {
          const msg =
            (err as { data?: { message?: string } })?.data?.message ??
            "Could not create user";
          setError(msg);
        },
      },
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
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
              onClick={() =>
                logout.mutate(undefined, { onSuccess: () => navigate("/login") })
              }
              className="text-sm text-stone-600 hover:text-stone-900"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[hsl(var(--primary))] mb-2">
            Admin · User rights
          </p>
          <h1 className="font-serif text-4xl font-bold text-stone-900">
            Create Reviewer or Admin
          </h1>
          <p className="text-stone-600 mt-3">
            Reviewer and Admin accounts are not self-registerable. Create them
            here — the new user can sign in immediately with the password you set.
          </p>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                Role to create
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("reviewer")}
                  className={`flex items-start gap-3 text-left p-4 rounded-xl border-2 transition ${
                    role === "reviewer"
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <ShieldPlus className="w-5 h-5 mt-0.5 text-[hsl(var(--primary))]" />
                  <div>
                    <div className="font-semibold text-stone-900">Reviewer</div>
                    <div className="text-xs text-stone-600 mt-1">
                      Verifies vulnerable profiles and activates Major emergencies.
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("admin")}
                  className={`flex items-start gap-3 text-left p-4 rounded-xl border-2 transition ${
                    role === "admin"
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <ShieldPlus className="w-5 h-5 mt-0.5 text-[hsl(var(--primary))]" />
                  <div>
                    <div className="font-semibold text-stone-900">Admin</div>
                    <div className="text-xs text-stone-600 mt-1">
                      Full oversight. Can grant rights and deactivate emergencies.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Initial password (min 8 characters)
              </label>
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 font-mono focus:outline-none focus:border-[hsl(var(--primary))]"
              />
              <p className="text-xs text-stone-500 mt-1.5">
                Share this with the new user out-of-band. They can change it after first login.
              </p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {created && (
              <div className="text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-3 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  Created <strong>{created.role}</strong> account for{" "}
                  <span className="font-mono">{created.email}</span> (id {created.id}).
                  They can now sign in.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={create.isPending}
              className="w-full bg-[hsl(var(--primary))] text-white rounded-lg py-2.5 font-medium hover:opacity-90 disabled:opacity-60 transition"
            >
              {create.isPending ? "Creating…" : "Create account"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
