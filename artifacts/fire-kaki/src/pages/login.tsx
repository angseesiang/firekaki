import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Flame, ArrowLeft } from "lucide-react";
import { useLogin } from "@/lib/auth";
import type { LoginRequest } from "@workspace/api-client-react";

const ROLES: Array<{ value: LoginRequest["role"]; label: string }> = [
  { value: "vulnerable", label: "Vulnerable" },
  { value: "volunteer", label: "Volunteer" },
  { value: "reviewer", label: "Reviewer" },
  { value: "admin", label: "Admin" },
];

export default function LoginPage() {
  const [, navigate] = useLocation();
  const login = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<LoginRequest["role"]>("volunteer");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    login.mutate(
      { email, password, role },
      {
        onSuccess: () => navigate("/dashboard"),
        onError: (err) => {
          const msg =
            (err as { data?: { message?: string } })?.data?.message ??
            "Could not log in";
          setError(msg);
        },
      },
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-[hsl(var(--primary))]">
            <Flame className="w-5 h-5" />
            <span className="font-serif text-xl font-bold">Fire Kaki</span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-[hsl(var(--primary))] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
          <h1 className="font-serif text-3xl font-bold text-stone-900 mb-2">
            Welcome back
          </h1>
          <p className="text-stone-600 mb-8 text-sm">
            Sign in to your role vault.
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Sign in as
              </label>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    type="button"
                    key={r.value}
                    onClick={() => setRole(r.value)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition ${
                      role === r.value
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5 text-[hsl(var(--primary))]"
                        : "border-stone-200 text-stone-700 hover:border-stone-300"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
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
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full bg-[hsl(var(--primary))] text-white rounded-lg py-2.5 font-medium hover:bg-[hsl(var(--primary))]/90 disabled:opacity-60 transition"
            >
              {login.isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="text-sm text-stone-600 mt-6 text-center">
            New here?{" "}
            <Link href="/signup" className="text-[hsl(var(--primary))] font-medium hover:underline">
                Create an account
              </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
