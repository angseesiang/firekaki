import { useState, type FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { Flame, Heart, Users, ArrowLeft } from "lucide-react";
import { useSignup } from "@/lib/auth";
import type { SignupRequest } from "@workspace/api-client-react";

type Role = "volunteer" | "vulnerable";

export default function SignupPage() {
  const [, navigate] = useLocation();
  const signup = useSignup();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("volunteer");

  const [skills, setSkills] = useState("");
  const [gpsConsent, setGpsConsent] = useState(true);

  const [address, setAddress] = useState("");
  const [nokName, setNokName] = useState("");
  const [nokRelation, setNokRelation] = useState("");
  const [nokContact, setNokContact] = useState("");

  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    const body: SignupRequest = {
      email,
      password,
      name,
      roles: [role],
      ...(role === "volunteer" && {
        volunteer: { skills: skills || undefined, gpsConsent },
      }),
      ...(role === "vulnerable" && {
        vulnerable: { address, nokName, nokRelation, nokContact },
      }),
    };

    signup.mutate(body, {
      onSuccess: () => navigate("/dashboard?welcome=1"),
      onError: (err) => {
        const msg =
          (err as { data?: { message?: string } })?.data?.message ??
          "Could not complete sign-up";
        setError(msg);
      },
    });
  }

  const asVolunteer = role === "volunteer";
  const asVulnerable = role === "vulnerable";

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl">
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
            Join the network
          </h1>
          <p className="text-stone-600 mb-8 text-sm">
            Sign up as a Volunteer or as a Vulnerable resident. If you'd like to
            do both, sign up once for each — you can use the same email address.
            Reviewer and Admin accounts are created by an Admin.
          </p>

          <form onSubmit={onSubmit} className="space-y-6">
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
                Password (min 8 characters)
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                Sign up as
              </label>
              <div
                role="radiogroup"
                aria-label="Sign up as"
                className="grid sm:grid-cols-2 gap-3"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={asVolunteer}
                  onClick={() => setRole("volunteer")}
                  className={`flex items-start gap-3 text-left p-4 rounded-xl border-2 transition ${
                    asVolunteer
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <Users className="w-5 h-5 mt-0.5 text-[hsl(var(--primary))]" />
                  <div>
                    <div className="font-semibold text-stone-900">Volunteer</div>
                    <div className="text-xs text-stone-600 mt-1">
                      Trained neighbour who responds within a 2 km radius.
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={asVulnerable}
                  onClick={() => setRole("vulnerable")}
                  className={`flex items-start gap-3 text-left p-4 rounded-xl border-2 transition ${
                    asVulnerable
                      ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/5"
                      : "border-stone-200 hover:border-stone-300"
                  }`}
                >
                  <Heart className="w-5 h-5 mt-0.5 text-[hsl(var(--primary))]" />
                  <div>
                    <div className="font-semibold text-stone-900">Vulnerable</div>
                    <div className="text-xs text-stone-600 mt-1">
                      Resident who may need help. Verified by a Reviewer.
                    </div>
                  </div>
                </button>
              </div>
              <p className="text-xs text-stone-500 mt-2">
                Want both? Complete this signup, then sign up again with the same
                email and the other role.
              </p>
            </div>

            {asVolunteer && (
              <div className="space-y-4 border-l-2 border-[hsl(var(--primary))]/30 pl-4">
                <h3 className="font-semibold text-stone-900 text-sm">Volunteer details</h3>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                    Skills (e.g. CPR, AED, Basic first-aid)
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    placeholder="CPR, AED, Basic first-aid"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
                  />
                </div>
                <label className="flex items-start gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={gpsConsent}
                    onChange={(e) => setGpsConsent(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    I consent to GPS sharing while on duty so the platform can match me to
                    nearby incidents. (Required for Volunteers.)
                  </span>
                </label>
              </div>
            )}

            {asVulnerable && (
              <div className="space-y-4 border-l-2 border-[hsl(var(--primary))]/30 pl-4">
                <h3 className="font-semibold text-stone-900 text-sm">Vulnerable details</h3>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                    Home address
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Blk 207 Jln Besar #06-22"
                    className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
                  />
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                      Next-of-kin name
                    </label>
                    <input
                      type="text"
                      required
                      value={nokName}
                      onChange={(e) => setNokName(e.target.value)}
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                      Relation
                    </label>
                    <input
                      type="text"
                      required
                      value={nokRelation}
                      onChange={(e) => setNokRelation(e.target.value)}
                      placeholder="Daughter"
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">
                      Contact
                    </label>
                    <input
                      type="text"
                      required
                      value={nokContact}
                      onChange={(e) => setNokContact(e.target.value)}
                      placeholder="+65 9xxx xxxx"
                      className="w-full rounded-lg border border-stone-200 px-3 py-2 focus:outline-none focus:border-[hsl(var(--primary))]"
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={signup.isPending}
              className="w-full bg-[hsl(var(--primary))] text-white rounded-lg py-2.5 font-medium hover:bg-[hsl(var(--primary))]/90 disabled:opacity-60 transition"
            >
              {signup.isPending ? "Creating your account…" : "Create account"}
            </button>
          </form>

          <p className="text-sm text-stone-600 mt-6 text-center">
            Already have an account?{" "}
            <Link href="/login" className="text-[hsl(var(--primary))] font-medium hover:underline">
                Sign in
              </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
