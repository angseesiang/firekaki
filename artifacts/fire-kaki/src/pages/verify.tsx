import { useEffect, useState } from "react";
import { Link, useSearch } from "wouter";
import { Flame, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  verifyEmail,
  type VerifyEmailParams,
} from "@workspace/api-client-react";

type State =
  | { kind: "loading" }
  | { kind: "ok"; email: string; role: string }
  | { kind: "error"; message: string };

export default function VerifyPage() {
  const search = useSearch();
  const qc = useQueryClient();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    const params = new URLSearchParams(search);
    const token = params.get("token") ?? "";
    const role = params.get("role") ?? "";
    if (!token || (role !== "volunteer" && role !== "vulnerable")) {
      setState({ kind: "error", message: "Missing or invalid verification link." });
      return;
    }
    const query: VerifyEmailParams = {
      token,
      role: role as VerifyEmailParams["role"],
    };
    verifyEmail(query, { credentials: "include" })
      .then((r) => {
        setState({ kind: "ok", email: r.email, role: r.role });
        qc.invalidateQueries({ queryKey: ["/api/auth/me"] });
      })
      .catch((err: { data?: { message?: string } }) => {
        setState({
          kind: "error",
          message: err?.data?.message ?? "Verification failed.",
        });
      });
  }, [search, qc]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="flex items-center gap-2 text-[hsl(var(--primary))] mb-8 justify-center"
        >
          <Flame className="w-5 h-5" />
          <span className="font-serif text-xl font-bold">Fire Kaki</span>
        </Link>

        <div className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm text-center">
          {state.kind === "loading" && (
            <>
              <Loader2 className="w-10 h-10 mx-auto text-stone-400 animate-spin mb-4" />
              <h1 className="font-serif text-2xl font-bold text-stone-900">
                Verifying your email…
              </h1>
            </>
          )}
          {state.kind === "ok" && (
            <>
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-600 mb-4" />
              <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">
                Email verified
              </h1>
              <p className="text-stone-600 mb-6">
                <span className="font-mono">{state.email}</span> is confirmed
                for your <strong>{state.role}</strong> account.
              </p>
              <Link
                href="/dashboard"
                className="inline-block bg-[hsl(var(--primary))] text-white rounded-lg px-5 py-2.5 font-medium hover:opacity-90 transition"
              >
                Go to dashboard
              </Link>
            </>
          )}
          {state.kind === "error" && (
            <>
              <XCircle className="w-12 h-12 mx-auto text-red-600 mb-4" />
              <h1 className="font-serif text-2xl font-bold text-stone-900 mb-2">
                We couldn't verify that link
              </h1>
              <p className="text-stone-600 mb-6">{state.message}</p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/dashboard"
                  className="inline-block border border-stone-300 text-stone-700 rounded-lg px-5 py-2.5 font-medium hover:bg-stone-50 transition"
                >
                  Sign in & resend
                </Link>
                <Link
                  href="/"
                  className="inline-block bg-[hsl(var(--primary))] text-white rounded-lg px-5 py-2.5 font-medium hover:opacity-90 transition"
                >
                  Back to home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
