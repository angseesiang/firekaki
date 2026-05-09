import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Eye,
  Flame,
  HeartPulse,
  Lock,
  MapPin,
  Newspaper,
  Phone,
  Play,
  Settings,
  Shield,
  ShieldAlert,
  Smartphone,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const mediaBase = "https://media.firekaki.sg/videos";
const newsPdfHref = `${mediaBase}/firekaki-news.pdf`;
const apiBaseUrl = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").replace(/\/+$/, "");

type VideoMoment = {
  number: string;
  title: string;
  shortDescription: string;
  story: string;
  src: string;
  icon: LucideIcon;
};

type FireArticle = {
  title: string;
  url: string;
  source: string;
  publishedDate: string;
  summary: string;
  imageUrl?: string;
};

type FireNewsResponse = {
  source: "exa" | "fallback" | "stale";
  updatedAt: string;
  articles: FireArticle[];
};

const videoMoments: VideoMoment[] = [
  {
    number: "1",
    title: "Neighbours, paged in seconds",
    shortDescription: "An SOS fans out to every trained Kaki within 2 km.",
    story:
      "Madam Lim falls in her HDB flat. The moment she taps SOS, Fire Kaki pages every verified neighbour within 2 km: no calls, no waiting on hold.",
    src: `${mediaBase}/1.mp4`,
    icon: Bell,
  },
  {
    number: "2",
    title: "One tap from the vulnerable",
    shortDescription: "A single red button: no menus, no typing.",
    story:
      "The vulnerable resident sees one clear action. Fire Kaki keeps the interface calm, large, and legible when stress is already high.",
    src: `${mediaBase}/2.mp4`,
    icon: HeartPulse,
  },
  {
    number: "3",
    title: "Live coverage map",
    shortDescription: "Reviewers and admins watch volunteers converge in real time.",
    story:
      "Reviewers can see the active emergency, responder status, arrival progress, and the surrounding coverage area without switching tools.",
    src: `${mediaBase}/3.mp4`,
    icon: MapPin,
  },
  {
    number: "4",
    title: "Trained, verified Kakis",
    shortDescription: "Every responder is vetted before they are put on duty.",
    story:
      "Volunteers are verified, role-gated, and routed only when they are close enough to make the first few minutes count.",
    src: `${mediaBase}/4.mp4`,
    icon: Shield,
  },
  {
    number: "5",
    title: "Next-of-kin in the loop",
    shortDescription: "Family members watch over their loved ones from anywhere.",
    story:
      "Next-of-kin accounts can follow the linked resident's SOS feed, responder count, and arrival state without becoming responders themselves.",
    src: `${mediaBase}/5.mp4`,
    icon: Phone,
  },
  {
    number: "6",
    title: "Bridging the first 5 minutes",
    shortDescription: "Fire Kaki holds the line until SCDF arrives.",
    story:
      "The network does not replace SCDF. It creates a verified neighbourhood bridge for the first minutes before formal response arrives.",
    src: `${mediaBase}/6.mp4`,
    icon: Clock,
  },
];

const fallbackFireArticles: FireArticle[] = [
  {
    title: "Joo Seng flat fire: Man charged after allegedly burning charcoal in living room",
    url: "https://www.channelnewsasia.com/",
    source: "CNA",
    publishedDate: "2026-05-06T00:00:00.000Z",
    summary:
      "A Singapore flat fire case highlights how quickly a residential incident can escalate before formal response reaches the scene.",
  },
  {
    title: "Joo Seng fire: Man charged over blaze in HDB unit",
    url: "https://www.straitstimes.com/",
    source: "The Straits Times",
    publishedDate: "2026-05-06T00:00:00.000Z",
    summary:
      "A late-night HDB blaze underlines the need for nearby trained residents who can account for neighbours in the first minutes.",
  },
  {
    title: "Joo Seng Road flat blaze: Man to be charged with mischief by fire",
    url: "https://www.asiaone.com/",
    source: "AsiaOne",
    publishedDate: "2026-05-05T00:00:00.000Z",
    summary:
      "Reports of an HDB unit engulfed by fire show why location-aware volunteer paging is valuable for vulnerable residents.",
  },
  {
    title: "Couple in their 80s huddled in toilet as smoke from flat below filled their home",
    url: "https://www.straitstimes.com/",
    source: "The Straits Times",
    publishedDate: "2026-05-05T00:00:00.000Z",
    summary:
      "Smoke spread between units put elderly residents at risk, exactly the kind of scenario where neighbour checks matter.",
  },
  {
    title: "SMRT bus catches fire near Woodgrove Primary School in Woodlands; no injuries reported",
    url: "https://www.channelnewsasia.com/",
    source: "CNA",
    publishedDate: "2026-05-05T00:00:00.000Z",
    summary:
      "Public-area fire incidents reinforce the operational need for trusted, verified responders with live incident context.",
  },
];

const missionPillars = [
  {
    title: "REACH",
    description: "Every block, every channel. Web, WhatsApp, iOS, and Android.",
    icon: Users,
  },
  {
    title: "TRUST",
    description: "Verified people, protected data. Strict RBAC, field-level AES-256 encryption, and immutable audit logs.",
    icon: Shield,
  },
  {
    title: "SPEED",
    description: "From alert to arrival in minutes. Bridging the gap before SCDF arrives on scene.",
    icon: Clock,
  },
];

const pipelineSteps = [
  { label: "Trigger", detail: "SOS pressed", icon: Bell },
  { label: "Classify", detail: "Major / Minor", icon: ShieldAlert },
  { label: "Geofence", detail: "<= 2 km radius", icon: MapPin },
  { label: "Page", detail: "Multi-channel", icon: Smartphone },
  { label: "Respond", detail: "Accept / Decline", icon: Activity },
  { label: "Close", detail: "Admin only", icon: CheckCircle2 },
];

const roles = [
  {
    title: "Vulnerable (L1)",
    description: "Self-registers with next-of-kin, awaits verification, can trigger Minor emergency by requesting help.",
    icon: HeartPulse,
  },
  {
    title: "Volunteer (L2)",
    description: "Self-registers, mandatory GPS sharing. Receives, accepts, or declines alerts within 2 km. Inherits Vulnerable.",
    icon: Activity,
  },
  {
    title: "Reviewer (L3)",
    description: "Verifies vulnerable registrations, activates Major emergencies, sees all volunteer and vulnerable data.",
    icon: Eye,
  },
  {
    title: "Admin (L4)",
    description: "Grants and revokes rights across all roles, and is the only role authorised to deactivate emergencies.",
    icon: Settings,
  },
];

const permissionRows = [
  ["Self-register profile", true, true, true, true],
  ["Register next-of-kin", true, false, false, true],
  ["Request help -> Minor", true, false, false, true],
  ["Receive emergency alert <= 2 km", false, true, true, true],
  ["Accept / decline alert", false, true, true, true],
  ["View volunteer and vulnerable details", false, false, true, true],
  ["Verify vulnerable profile", false, false, true, true],
  ["Activate Major emergency", false, false, true, true],
  ["Deactivate emergency", false, false, false, true],
  ["Grant / revoke user rights", false, false, false, true],
] as const;

const volunteerJourney = [
  "Anonymous sign-up",
  "Profile + GPS consent",
  "Standby",
  "Alert within 2 km",
  "Dispatch to scene",
];

const vulnerableJourney = [
  "Self-register",
  "Next-of-kin details",
  "Reviewer verifies",
  "One-tap request",
  "Help arrives",
];

const roadmap = [
  {
    phase: "Q3 2026",
    title: "PILOT",
    description: "One GRC, web+WA+app, 4-role MVP, 500 vulnerable residents / 1.5k volunteers.",
  },
  {
    phase: "Q1 2027",
    title: "MOBILE + MULTI-GRC",
    description: "iOS and Android native apps, four languages, SCDF myResponder integration, 3 GRCs.",
  },
  {
    phase: "Q3 2027",
    title: "SMART ESCALATION",
    description: "Wearable fall-detection ingest, skill-aware routing, drill mode, and voice-activated SOS.",
  },
  {
    phase: "2028+",
    title: "NATIONAL SCALE",
    description: "All 17 GRCs and SMCs, cross-GRC mobility, public transparency, open API for VWOs.",
  },
];

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <SiteHeader />
      <main>
        <MotionHero />
        <NewsPdfSection />
        <RecentFiresSection />
        <MissionSection />
        <PipelineSection />
        <RolesSection />
        <PermissionsSection />
        <JourneysSection />
        <MockupsSection />
        <ArchitectureSection />
        <SecuritySection />
        <RoadmapSection />
        <CtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
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
  );
}

function MotionHero() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeMoment = videoMoments[activeIndex] ?? videoMoments[0];

  useEffect(() => {
    if (!hasStarted || !videoRef.current) return;

    videoRef.current.currentTime = 0;
    void videoRef.current.play();
  }, [activeIndex, hasStarted]);

  function startStory() {
    setHasStarted(true);
    void videoRef.current?.play();
  }

  function selectMoment(index: number) {
    setActiveIndex(index);
    setHasStarted(true);
  }

  function playNextMoment() {
    setActiveIndex((current) => (current + 1) % videoMoments.length);
  }

  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-14 lg:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Activity className="h-3.5 w-3.5" />
            See it in motion
          </div>
          <h1 className="font-serif text-5xl font-bold leading-[1.02] text-foreground md:text-7xl">
            Fire Kaki, in 6 moments.
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-xl leading-8 text-muted-foreground">
            Press play - each clip plays one after another, with sound, telling the full Kaki story.
          </p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <button
            type="button"
            onClick={startStory}
            className="group relative overflow-hidden rounded-[2rem] border border-card-border bg-card text-left shadow-xl"
            aria-label="Play the Fire Kaki six-moment story"
          >
            <video
              key={activeMoment.src}
              ref={videoRef}
              className={`aspect-[4/5] w-full object-cover transition duration-500 ${
                hasStarted ? "opacity-100" : "scale-105 blur-sm opacity-45"
              }`}
              src={activeMoment.src}
              playsInline
              preload="metadata"
              controls={hasStarted}
              onEnded={playNextMoment}
            />
            {!hasStarted ? (
              <span className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition group-hover:scale-105">
                  <Play className="ml-1 h-11 w-11 fill-current" />
                </span>
                <span className="mt-6 text-2xl font-bold">Play the story</span>
                <span className="mt-2 text-lg text-muted-foreground">6 clips - with sound - ~90 seconds</span>
              </span>
            ) : null}
          </button>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">
              Step {activeIndex + 1} - {String(activeIndex + 1).padStart(2, "0")}/06
            </p>
            <h2 className="mt-5 font-serif text-5xl font-bold leading-tight md:text-6xl">
              {activeMoment.title}
            </h2>
            <p className="mt-6 text-xl leading-9 text-foreground">{activeMoment.story}</p>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">{activeMoment.shortDescription}</p>

            <div className="mt-8 grid gap-3">
              {videoMoments.map((moment, index) => {
                const active = index === activeIndex;
                return (
                  <button
                    key={moment.number}
                    type="button"
                    onClick={() => selectMoment(index)}
                    className={`flex items-center gap-4 rounded-lg border px-4 py-3 text-left transition ${
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-transparent text-muted-foreground hover:border-border hover:bg-card"
                    }`}
                    aria-current={active ? "step" : undefined}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                        active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {moment.number}
                    </span>
                    <span className="font-bold">{moment.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function NewsPdfSection() {
  return (
    <section id="news" className="scroll-mt-16 border-b border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 lg:grid-cols-[0.62fr_1fr] lg:items-center lg:py-20">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Newspaper className="h-3.5 w-3.5" />
            In the news
          </div>
          <h2 className="font-serif text-4xl font-bold leading-tight md:text-5xl">
            The Jalan Besar Fire Safety Kakis story.
          </h2>
          <p className="mt-6 max-w-xl text-xl leading-9 text-muted-foreground">
            Fire Kaki is the digital backbone for the volunteer movement Singapore's press has been covering:
            verified neighbours holding the first 5 minutes before SCDF arrives.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-6 shadow-sm">
              <a href={newsPdfHref} target="_blank" rel="noreferrer">
                Open the news PDF
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 rounded-full px-6">
              <a href={newsPdfHref} download>
                Download
                <Download className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
        <div className="overflow-hidden rounded-xl border border-card-border bg-card shadow-lg">
          <iframe
            title="Jalan Besar Fire Safety Kakis news PDF"
            src={`${newsPdfHref}#view=FitH&toolbar=0&navpanes=0`}
            className="h-[560px] w-full bg-background md:h-[620px]"
          />
        </div>
      </div>
    </section>
  );
}

function RecentFiresSection() {
  const [feed, setFeed] = useState<FireNewsResponse>({
    source: "fallback",
    updatedAt: new Date().toISOString(),
    articles: fallbackFireArticles,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadFireNews() {
      try {
        const response = await fetch(`${apiBaseUrl}/api/news/recent-fires`, {
          headers: { accept: "application/json" },
        });

        if (!response.ok) throw new Error(`News feed returned ${response.status}`);

        const data = (await response.json()) as FireNewsResponse;
        if (!cancelled && Array.isArray(data.articles) && data.articles.length > 0) {
          setFeed(data);
        }
      } catch {
        if (!cancelled) {
          setFeed({
            source: "fallback",
            updatedAt: new Date().toISOString(),
            articles: fallbackFireArticles,
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadFireNews();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
        <div className="mb-10 max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Newspaper className="h-3.5 w-3.5" />
            Live feed
          </div>
          <h2 className="font-serif text-4xl font-bold leading-tight md:text-5xl">
            Recent fires in Singapore.
          </h2>
          <p className="mt-5 text-xl leading-9 text-muted-foreground">
            The latest large-scale fire incidents reported in Singapore: exactly the kind of moments
            where a verified neighbour minutes away could change the outcome.
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            {loading ? "Refreshing news feed..." : `Source: ${feed.source.toUpperCase()} - updated ${formatArticleDate(feed.updatedAt)}`}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {feed.articles.slice(0, 6).map((article) => (
            <FireArticleCard key={`${article.url}-${article.title}`} article={article} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FireArticleCard({ article }: { article: FireArticle }) {
  return (
    <Card className="overflow-hidden rounded-xl border-card-border bg-card shadow-sm">
      <div className="aspect-[16/9] overflow-hidden bg-muted">
        {article.imageUrl ? (
          <img className="h-full w-full object-cover" src={article.imageUrl} alt="" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center text-primary">
            <Flame className="h-12 w-12" />
          </div>
        )}
      </div>
      <CardContent className="flex min-h-[300px] flex-col p-6">
        <div className="flex flex-wrap items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">
          <Flame className="h-4 w-4 text-primary" />
          <span className="text-primary">{article.source}</span>
          <span>-</span>
          <span>{formatArticleDate(article.publishedDate)}</span>
        </div>
        <h3 className="mt-5 font-serif text-2xl font-bold leading-tight">{article.title}</h3>
        <p className="mt-4 line-clamp-3 leading-7 text-muted-foreground">{article.summary}</p>
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="mt-auto inline-flex items-center gap-2 pt-6 font-bold text-primary hover:underline"
        >
          Read article
          <ExternalLink className="h-4 w-4" />
        </a>
      </CardContent>
    </Card>
  );
}

function MissionSection() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 lg:grid-cols-[0.9fr_1fr] lg:items-center lg:py-20">
        <div>
          <h2 className="font-serif text-4xl font-bold">The Problem</h2>
          <p className="mt-5 text-xl leading-9 text-muted-foreground">
            Our aging population is increasingly living alone in HDB flats. In an emergency, the first
            5 minutes decide outcomes. While volunteer goodwill is abundant, it remains fragmented
            across GRCs in paper forms and uncoordinated chat groups.
          </p>
          <h2 className="mt-10 font-serif text-4xl font-bold">The Mission</h2>
          <blockquote className="mt-5 rounded-xl border border-card-border border-l-primary bg-card p-6 font-serif text-2xl italic leading-10 shadow-sm">
            "Equip every neighbourhood with a verified, GPS-aware volunteer network so that no vulnerable
            resident faces an emergency alone."
          </blockquote>
        </div>
        <div className="grid gap-5">
          {missionPillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <Card key={pillar.title} className="rounded-xl border-card-border shadow-sm">
                <CardContent className="flex gap-5 p-6">
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-7 w-7" />
                  </span>
                  <div>
                    <h3 className="text-2xl font-bold tracking-tight">{pillar.title}</h3>
                    <p className="mt-2 text-lg leading-8 text-muted-foreground">{pillar.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PipelineSection() {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-6xl px-5 py-16 text-center lg:py-20">
        <h2 className="font-serif text-4xl font-bold md:text-5xl">Emergency Response Pipeline</h2>
        <p className="mx-auto mt-4 max-w-3xl text-xl leading-9 text-muted-foreground">
          From the moment of crisis to resolution, a 6-step orchestrated response.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {pipelineSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.label} className="rounded-xl border border-card-border bg-background p-5 shadow-sm">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background text-primary shadow-sm">
                  <Icon className="h-7 w-7" />
                </span>
                <h3 className="mt-5 text-xl font-bold">{step.label}</h3>
                <p className="mt-1 text-muted-foreground">{step.detail}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-12 grid gap-6 text-left lg:grid-cols-2">
          <EmergencyType
            tone="major"
            title="Major Emergency"
            description="Life-threatening to 2+ people, heavy resources needed, with fire as the canonical example. Activated by Admin or Reviewer only."
            message="Major emergency on-going. Heavy resources needed."
            radius="All volunteers within 2 km"
          />
          <EmergencyType
            tone="minor"
            title="Minor Emergency"
            description="Single person, conscious, non-fatal. A vulnerable resident's request for help is automatically classed as Minor."
            message="Minor emergency on-going. Assistance requested."
            radius="2 km closest routing"
          />
        </div>
      </div>
    </section>
  );
}

function EmergencyType({
  tone,
  title,
  description,
  message,
  radius,
}: {
  tone: "major" | "minor";
  title: string;
  description: string;
  message: string;
  radius: string;
}) {
  const major = tone === "major";
  return (
    <Card className={`rounded-xl border-card-border shadow-sm ${major ? "border-l-4 border-l-primary" : "border-l-4 border-l-secondary"}`}>
      <CardContent className="p-8">
        <div className={`mb-5 flex items-center gap-4 ${major ? "text-primary" : "text-secondary-foreground"}`}>
          {major ? <AlertTriangle className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}
          <h3 className="text-3xl font-bold">{title}</h3>
        </div>
        <p className="text-lg leading-8 text-muted-foreground">{description}</p>
        <div className={`mt-6 rounded-lg p-4 font-mono text-sm ${major ? "bg-primary/10 text-primary" : "bg-secondary/20 text-secondary-foreground"}`}>
          "{message}"
        </div>
        <ul className="mt-6 space-y-2 text-base">
          <li>
            <strong>Paging radius:</strong> {radius}
          </li>
          <li>
            <strong>Deactivation:</strong> Admin only
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}

function RolesSection() {
  return (
    <section className="border-b border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-5 py-16 text-center lg:py-20">
        <h2 className="font-serif text-4xl font-bold md:text-5xl">Four Layers of Responsibility</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <Card key={role.title} className="rounded-xl border-card-border bg-background text-left shadow-sm">
                <CardContent className="p-7">
                  <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-7 w-7" />
                  </span>
                  <h3 className="mt-10 text-2xl font-bold">{role.title}</h3>
                  <p className="mt-5 text-lg leading-8 text-muted-foreground">{role.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PermissionsSection() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-16 text-center lg:py-20">
        <h2 className="font-serif text-4xl font-bold md:text-5xl">Strict Role-Based Access</h2>
        <p className="mt-4 text-xl text-muted-foreground">Least-privilege architecture enforced at the API level.</p>
        <div className="mt-10 overflow-x-auto rounded-xl border border-card-border bg-card shadow-sm">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead className="bg-muted text-sm uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4 text-center">Vulnerable</th>
                <th className="px-6 py-4 text-center">Volunteer</th>
                <th className="px-6 py-4 text-center text-primary">Reviewer</th>
                <th className="px-6 py-4 text-center text-primary">Admin</th>
              </tr>
            </thead>
            <tbody>
              {permissionRows.map((row) => (
                <tr key={row[0]} className="border-t border-border">
                  <td className="px-6 py-5 font-medium">{row[0]}</td>
                  {row.slice(1).map((allowed, index) => (
                    <td key={`${row[0]}-${index}`} className="px-6 py-5 text-center">
                      {allowed ? (
                        <span className={`mx-auto block h-4 w-4 rounded-full ${index >= 2 ? "bg-primary" : "bg-foreground"}`} />
                      ) : (
                        <span className="text-muted-foreground/45">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function JourneysSection() {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 py-16 lg:grid-cols-2 lg:py-20">
        <Journey title="Volunteer Journey" eyebrow="L2 User" icon={Activity} steps={volunteerJourney} tone="primary" />
        <Journey title="Vulnerable Journey" eyebrow="L1 User" icon={HeartPulse} steps={vulnerableJourney} tone="secondary" />
      </div>
    </section>
  );
}

function Journey({
  title,
  eyebrow,
  icon: Icon,
  steps,
  tone,
}: {
  title: string;
  eyebrow: string;
  icon: LucideIcon;
  steps: string[];
  tone: "primary" | "secondary";
}) {
  const toneClass = tone === "primary" ? "text-primary border-primary" : "text-secondary-foreground border-secondary";
  return (
    <div>
      <div className={`mb-6 inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] ${toneClass}`}>
        <Icon className="h-4 w-4" />
        {eyebrow}
      </div>
      <h2 className="font-serif text-4xl font-bold">{title}</h2>
      <div className="relative mt-8 space-y-5 before:absolute before:bottom-6 before:left-6 before:top-6 before:w-px before:bg-border">
        {steps.map((step, index) => (
          <div key={step} className="relative grid grid-cols-[3rem_1fr] items-center gap-5">
            <span className={`z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-background text-lg font-bold ${toneClass}`}>
              {index + 1}
            </span>
            <div className="rounded-xl border border-card-border bg-background p-5 text-xl font-bold shadow-sm">
              {step}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockupsSection() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-16 lg:py-20">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <h2 className="font-serif text-4xl font-bold md:text-5xl">Designed for Urgency</h2>
          <p className="mt-4 text-xl leading-9 text-muted-foreground">
            High-contrast, large touch targets, and clear hierarchy. Mobile-native interfaces for people under stress.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-10 lg:flex-row">
          <VolunteerPhone />
          <VulnerablePhone />
        </div>
        <AdminMockup />
      </div>
    </section>
  );
}

function VolunteerPhone() {
  return (
    <div className="w-full max-w-[360px]">
      <div className="mx-auto mb-4 flex w-fit gap-2 rounded-full bg-muted p-1 text-sm font-bold">
        {["Standby", "Alert", "En Route"].map((tab, index) => (
          <span key={tab} className={`rounded-full px-4 py-2 ${index === 0 ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {tab}
          </span>
        ))}
      </div>
      <PhoneShell title="Volunteer App">
        <h3 className="font-serif text-3xl font-bold">
          Good evening,
          <span className="block text-primary">Wei Ming</span>
        </h3>
        <StatusCard title="You're on duty" detail="GPS sharing active" icon={Activity} />
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Current location</p>
          <p className="mt-2 text-lg font-bold">Blk 207, Jln Besar</p>
        </div>
        <div className="mt-auto">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Your skills</p>
          <div className="flex flex-wrap gap-2">
            {["CPR", "AED", "First-aid"].map((skill) => (
              <span key={skill} className="rounded-full bg-muted px-4 py-2 text-xs font-bold">{skill}</span>
            ))}
          </div>
        </div>
      </PhoneShell>
    </div>
  );
}

function VulnerablePhone() {
  return (
    <div className="w-full max-w-[360px]">
      <div className="mx-auto mb-4 flex w-fit gap-2 rounded-full bg-muted p-1 text-sm font-bold">
        {["Home", "Confirm", "Coming"].map((tab, index) => (
          <span key={tab} className={`rounded-full px-4 py-2 ${index === 0 ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
            {tab}
          </span>
        ))}
      </div>
      <PhoneShell title="Vulnerable App" accent>
        <div className="text-center">
          <h3 className="font-serif text-4xl font-bold">Hi, Madam Tan</h3>
          <p className="mx-auto mt-4 max-w-[260px] text-lg leading-8 text-muted-foreground">
            Press the button if you need help. Help comes to you.
          </p>
          <div className="mx-auto mt-12 flex h-48 w-48 flex-col items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
            <Bell className="h-14 w-14" />
            <span className="mt-3 text-4xl font-bold tracking-[0.14em]">SOS</span>
          </div>
        </div>
        <div className="mt-auto rounded-xl border border-border bg-card p-5 text-left">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Next of kin on file</p>
          <p className="mt-2 text-xl font-bold">Tan Wei Ling</p>
          <p className="text-muted-foreground">Daughter</p>
        </div>
      </PhoneShell>
    </div>
  );
}

function PhoneShell({ title, accent = false, children }: { title: string; accent?: boolean; children: ReactNode }) {
  return (
    <div>
      <div className="rounded-[3rem] bg-muted p-4 shadow-xl">
        <div className="mx-auto mb-5 h-7 w-36 rounded-full bg-background" />
        <div className="flex min-h-[620px] flex-col gap-6 rounded-[2.2rem] border border-border bg-background p-7">
          {children}
        </div>
      </div>
      <p className={`mt-6 text-center font-serif text-2xl font-bold ${accent ? "text-secondary-foreground" : "text-foreground"}`}>
        {title}
      </p>
    </div>
  );
}

function StatusCard({
  title,
  detail,
  icon: Icon,
}: {
  title: string;
  detail: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-green-600" />
        <p className="text-xl font-bold">{title}</p>
      </div>
      <p className="mt-3 text-muted-foreground">{detail}</p>
    </div>
  );
}

function AdminMockup() {
  return (
    <div className="mx-auto mt-20 max-w-5xl">
      <div className="mb-8 text-center">
        <h3 className="font-serif text-4xl font-bold">Admin Console</h3>
        <p className="mt-3 text-xl text-muted-foreground">Dense, data-rich command center for GRC reviewers.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-card-border bg-card shadow-xl">
        <div className="flex h-12 items-center gap-3 border-b border-border bg-muted px-4">
          <span className="h-3 w-3 rounded-full bg-primary/60" />
          <span className="h-3 w-3 rounded-full bg-secondary" />
          <span className="h-3 w-3 rounded-full bg-green-500" />
          <Flame className="ml-4 h-4 w-4 text-primary" />
          <span className="font-serif font-bold">Fire Kaki Admin</span>
          <span className="ml-auto hidden rounded-md border border-border bg-background px-4 py-1 text-sm text-muted-foreground md:block">
            Search residents...
          </span>
        </div>
        <div className="grid md:grid-cols-[210px_1fr]">
          <div className="hidden border-r border-border p-5 text-sm md:block">
            {["Overview", "Verifications", "Volunteers", "Vulnerable", "Live emergencies"].map((item, index) => (
              <div key={item} className={`mb-2 rounded-md px-4 py-3 font-bold ${index === 0 ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                {item}
              </div>
            ))}
            <p className="mt-8 px-4 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">System</p>
            {["Audit log", "User rights", "Settings"].map((item) => (
              <div key={item} className="px-4 py-3 text-muted-foreground">{item}</div>
            ))}
          </div>
          <div className="p-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <AdminMetric value="312" label="Vulnerable Verified" />
              <AdminMetric value="874" label="Volunteers Active" />
              <AdminMetric value="2" label="Live Emergencies" alert />
              <AdminMetric value="98%" label="Coverage <= 2 km" success />
            </div>
            <h4 className="mt-8 text-xl font-bold">Verification Queue</h4>
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              {["Tan Ah Mui (82-F)", "Mohammed Ismail (79-M)", "Lim Geok Hua (85-F)", "Krishnan Devi (76-F)", "Goh Ah Seng (81-M)"].map((name, index) => (
                <div key={name} className={`grid gap-3 border-b border-border px-4 py-4 text-sm last:border-b-0 md:grid-cols-[1.2fr_1fr_0.8fr] ${index === 3 ? "bg-primary/5" : "bg-background"}`}>
                  <span className="font-bold">{name}</span>
                  <span className="text-muted-foreground">Blk {207 + index * 4} #{index + 4}-12</span>
                  <span className={`w-fit rounded-md px-3 py-1 text-xs font-bold ${index === 3 ? "bg-primary text-primary-foreground" : index === 4 ? "bg-green-100 text-green-700" : "bg-secondary/20 text-secondary-foreground"}`}>
                    {index === 3 ? "LIVE" : index === 4 ? "VERIFIED" : "PENDING"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminMetric({ value, label, alert = false, success = false }: { value: string; label: string; alert?: boolean; success?: boolean }) {
  return (
    <div className={`rounded-xl p-5 ${alert ? "bg-primary text-primary-foreground" : "border border-border bg-background"}`}>
      <p className={`text-4xl font-bold ${success ? "text-green-600" : ""}`}>{value}</p>
      <p className={`mt-2 text-sm font-medium ${alert ? "text-primary-foreground/90" : "text-muted-foreground"}`}>{label}</p>
    </div>
  );
}

function ArchitectureSection() {
  return (
    <section className="border-b border-border bg-card">
      <div className="mx-auto max-w-6xl px-5 py-16 text-center lg:py-20">
        <h2 className="font-serif text-4xl font-bold md:text-5xl">System Architecture</h2>
        <p className="mx-auto mt-4 max-w-3xl text-xl leading-9 text-muted-foreground">
          A modern, secure, 4-tier stack designed for national resilience.
        </p>
        <div className="mt-12 grid gap-6 text-left">
          <ArchitectureLayer title="L1 Channels" items={["Website (React)", "WhatsApp API", "iOS (Swift)", "Android (Kotlin)"]} tone="default" />
          <ArchitectureLayer title="L2 Edge" items={["API Gateway", "OAuth2 MFA", "Rate Limiting", "WAF (OWASP Top 10)"]} tone="edge" />
          <ArchitectureLayer title="L3 Services" items={["Identity & RBAC", "Geofence Engine (2km)", "Emergency Dispatcher", "Notification Fanout"]} tone="service" />
          <ArchitectureLayer title="L4 Data" items={["PII Vault (AES-256)", "Audit Ledger", "GPS (24h expiry)", "Health Vault"]} tone="data" />
        </div>
      </div>
    </section>
  );
}

function ArchitectureLayer({ title, items, tone }: { title: string; items: string[]; tone: "default" | "edge" | "service" | "data" }) {
  const shell =
    tone === "service"
      ? "border-secondary bg-secondary/10"
      : tone === "data"
        ? "border-primary bg-primary/10"
        : tone === "edge"
          ? "border-muted-foreground/30 bg-muted"
          : "border-card-border bg-background";

  return (
    <div className={`grid gap-6 rounded-2xl border p-6 shadow-sm md:grid-cols-[170px_1fr] md:items-center ${shell}`}>
      <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-primary">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item} className="rounded-xl border border-card-border bg-card p-4 text-center font-bold shadow-sm">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function SecuritySection() {
  return (
    <section className="border-b border-border bg-foreground text-background">
      <div className="mx-auto max-w-6xl px-5 py-16 text-center lg:py-20">
        <Shield className="mx-auto h-16 w-16 text-primary" />
        <h2 className="mt-8 font-serif text-4xl font-bold text-background md:text-5xl">Gov-Grade Data Security</h2>
        <div className="mt-12 grid gap-8 text-left md:grid-cols-3">
          <SecurityPoint title="Encryption & Privacy" icon={Lock}>
            TLS 1.3 in transit plus AES-256 field-level encryption at rest. Fully PDPA-aligned.
          </SecurityPoint>
          <SecurityPoint title="Access Control" icon={Settings}>
            Least-privilege RBAC enforced at the API layer. MFA is mandatory for Admins.
          </SecurityPoint>
          <SecurityPoint title="Auditing & Lifecycle" icon={Eye}>
            Immutable append-only ledger for every PII read. Volunteer GPS data auto-expires every 24h.
          </SecurityPoint>
        </div>
      </div>
    </section>
  );
}

function SecurityPoint({ title, icon: Icon, children }: { title: string; icon: LucideIcon; children: ReactNode }) {
  return (
    <div>
      <Icon className="h-8 w-8 text-secondary" />
      <h3 className="mt-6 text-2xl font-bold text-background">{title}</h3>
      <p className="mt-4 text-lg leading-8 text-background/70">{children}</p>
    </div>
  );
}

function RoadmapSection() {
  return (
    <section className="border-b border-border bg-background">
      <div className="mx-auto max-w-6xl px-5 py-16 text-center lg:py-20">
        <h2 className="font-serif text-4xl font-bold md:text-5xl">The Road to Scale</h2>
        <p className="mt-4 text-xl text-muted-foreground">From a single neighbourhood to a national shield.</p>
        <div className="mt-12 grid gap-8 text-left md:grid-cols-2 lg:grid-cols-4">
          {roadmap.map((item, index) => (
            <div key={item.phase} className="relative border-l-4 border-border pl-8">
              <span className={`absolute -left-3 top-0 h-5 w-5 rounded-full border-4 border-background ${index === 0 ? "bg-primary" : "bg-muted-foreground"}`} />
              <p className="text-2xl font-bold">{item.phase}</p>
              <p className={`mt-2 text-sm font-bold uppercase tracking-[0.16em] ${index === 0 ? "text-primary" : "text-foreground"}`}>{item.title}</p>
              <p className="mt-5 text-lg leading-8 text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="bg-muted/30">
      <div className="mx-auto max-w-6xl px-5 py-16 text-center lg:py-20">
        <h2 className="font-serif text-5xl font-bold md:text-6xl">Partner with us.</h2>
        <p className="mx-auto mt-6 max-w-4xl text-2xl leading-10 text-muted-foreground">
          The Jalan Besar pilot proved that neighbours save lives. Now it is time to build the infrastructure
          to scale that humanity.
        </p>
        <div className="mx-auto mt-12 grid max-w-5xl gap-6 text-left md:grid-cols-3">
          {[
            ["A Pilot GRC", "For a 9-month scale-up building on the initial pilot success."],
            ["An SCDF Bridge", "Working-level access to align technically with SCDF myResponder."],
            ["Data Framework", "Joint security and privacy review with IMDA and PDPC."],
          ].map(([title, description]) => (
            <Card key={title} className="rounded-xl border-card-border bg-background shadow-sm">
              <CardContent className="p-7">
                <h3 className="text-2xl font-bold text-primary">{title}</h3>
                <p className="mt-5 text-lg leading-8 text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button size="lg" className="mt-12 h-14 rounded-full px-10 text-lg">
          Take the Meeting
        </Button>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col justify-between gap-6 px-5 py-10 text-sm text-muted-foreground md:flex-row md:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 font-serif text-2xl font-bold text-foreground">
            <Flame className="h-5 w-5 text-primary" />
            Fire Kaki
          </div>
          <p>Community Safety Network Proposal</p>
        </div>
        <div className="md:text-right">
          <p className="text-foreground">Authors: Ang See Siang, Volodymyr Iermolaiev - May 2026</p>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.16em]">Inspired by the Jalan Besar Fire Safety Kakis</p>
        </div>
      </div>
    </footer>
  );
}

function formatArticleDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recent";

  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}
