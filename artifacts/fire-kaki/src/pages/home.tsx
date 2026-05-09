import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Bell,
  CheckCircle2,
  ChevronRight,
  Flame,
  HeartPulse,
  MapPin,
  Phone,
  ShieldCheck,
  Siren,
  UserCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type RoleEntry = {
  title: string;
  description: string;
  href: string;
  action: string;
  icon: LucideIcon;
};

const roleEntries: RoleEntry[] = [
  {
    title: "Residents and next-of-kin",
    description: "Create a verified profile, keep contacts on file, and make help reachable with one clear SOS action.",
    href: "/signup",
    action: "Set up resident access",
    icon: HeartPulse,
  },
  {
    title: "Volunteers",
    description: "Stay on duty, share location when available, and respond to nearby incidents within the response radius.",
    href: "/signup",
    action: "Join as volunteer",
    icon: Users,
  },
  {
    title: "Reviewers and admins",
    description: "Verify residents, monitor live emergencies, manage responders, and close incidents from one console.",
    href: "/login",
    action: "Open operations console",
    icon: ShieldCheck,
  },
];

const metrics = [
  { value: "2 km", label: "response radius", icon: MapPin },
  { value: "4", label: "role-aware workflows", icon: UserCheck },
  { value: "Live", label: "emergency console", icon: Activity },
];

const responseSteps = [
  { label: "SOS received", icon: Bell },
  { label: "Nearby kakis paged", icon: MapPin },
  { label: "Help en route", icon: CheckCircle2 },
];

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="border-b border-border bg-card/90">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2 text-primary">
            <Flame className="h-5 w-5" />
            <span className="font-serif text-xl font-bold text-foreground">Fire Kaki</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Sign up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[1fr_420px] lg:py-14">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              <Siren className="h-3.5 w-3.5" />
              Community safety network
            </div>
            <h1 className="font-serif text-5xl font-bold leading-[1.02] tracking-normal text-foreground md:text-6xl">
              Fast neighbour response for vulnerable residents.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              Fire Kaki connects residents, next-of-kin, trained volunteers, reviewers, and admins around one urgent workflow: get help moving before formal response arrives.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="h-12 rounded-lg px-5 text-base">
                <Link href="/signup">
                  Join the network
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-lg px-5 text-base">
                <Link href="/login">Open dashboard</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border bg-card p-4 shadow-sm">
            <div className="rounded-[1.5rem] border border-border bg-background p-5">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Verified resident
                  </p>
                  <h2 className="mt-1 font-serif text-3xl font-bold">Madam Tan</h2>
                </div>
                <Phone className="h-5 w-5 text-accent" />
              </div>

              <div className="flex justify-center py-6">
                <div className="flex h-44 w-44 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <Bell className="h-12 w-12" />
                  <span className="mt-2 text-3xl font-bold tracking-[0.14em]">SOS</span>
                </div>
              </div>

              <div className="mt-4 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Help status
                    </p>
                    <p className="mt-1 text-xl font-bold">3 neighbours en route</p>
                  </div>
                  <span className="rounded-lg bg-secondary px-3 py-1 text-sm font-bold text-secondary-foreground">
                    3 min
                  </span>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {responseSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.label} className="flex items-center gap-3 text-sm font-medium">
                      <Icon className="h-4 w-4 text-primary" />
                      <span>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-6xl gap-4 px-5 py-6 md:grid-cols-3">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="flex items-center gap-4 rounded-lg border border-border bg-background p-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-2xl font-bold">{metric.value}</div>
                    <div className="text-sm text-muted-foreground">{metric.label}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-12">
          <div className="mb-6 flex flex-col justify-between gap-2 md:flex-row md:items-end">
            <div>
              <h2 className="font-serif text-3xl font-bold">Choose your entry point</h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Each role lands in the same shared response system with only the controls it needs.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {roleEntries.map((entry) => {
              const Icon = entry.icon;
              return (
                <Card key={entry.title} className="rounded-lg border-card-border shadow-sm">
                  <CardContent className="flex h-full flex-col p-5">
                    <Icon className="mb-5 h-7 w-7 text-primary" />
                    <h3 className="text-xl font-bold">{entry.title}</h3>
                    <p className="mt-3 flex-1 text-sm leading-6 text-muted-foreground">
                      {entry.description}
                    </p>
                    <Button asChild variant="outline" className="mt-6 justify-between rounded-lg">
                      <Link href={entry.href}>
                        {entry.action}
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
