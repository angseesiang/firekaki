import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, 
  MapPin, 
  Smartphone, 
  Activity,
  Users,
  CheckCircle,
  Eye,
  Settings,
  Lock,
  Bell,
  Clock,
  Shield,
  HeartPulse,
  Flame,
  Server,
  Database,
  ArrowRight,
  Menu,
  X,
  AlertTriangle,
  Info,
  ChevronRight,
  Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground">
      <Navbar />
      <main>
        <HeroSection />
        <MissionSection />
        <PipelineSection />
        <RolesSection />
        <PermissionsSection />
        <JourneysSection />
        <MockupsSection />
        <ArchitectureSection />
        <SecuritySection />
        <RoadmapSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}

const navLinks = [
  { name: "Mission", href: "#mission" },
  { name: "Roles", href: "#roles" },
  { name: "Flows", href: "#flows" },
  { name: "Mockups", href: "#mockups" },
  { name: "Architecture", href: "#architecture" },
  { name: "Security", href: "#security" },
  { name: "Roadmap", href: "#roadmap" },
];

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/80 border-b border-border transition-all">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight text-primary hover:opacity-80 transition-opacity">
          <Flame className="w-6 h-6" />
          <span>Fire Kaki</span>
        </a>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {navLinks.map(link => (
            <a key={link.name} href={link.href} className="hover:text-primary transition-colors">{link.name}</a>
          ))}
          <a href="/login" className="hover:text-primary transition-colors">Sign in</a>
          <a href="/signup" className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity">Sign up</a>
        </nav>
        <div className="md:hidden">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-foreground">
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-b border-border bg-background overflow-hidden"
          >
            <div className="px-6 py-4 flex flex-col gap-4 text-sm font-medium">
              {navLinks.map(link => (
                <a key={link.name} href={link.href} onClick={() => setMobileOpen(false)} className="hover:text-primary transition-colors">{link.name}</a>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 px-6 overflow-hidden">
      <div className="container mx-auto max-w-5xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs tracking-widest uppercase mb-8 ring-1 ring-primary/20 shadow-sm">
            <ShieldAlert className="w-4 h-4" />
            <span>Community Safety Network</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold tracking-tight text-foreground leading-[1.1] mb-8">
            A neighbour-powered first-response network for Singapore's most vulnerable.
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 font-medium">
            Bridging the critical first 5 minutes before SCDF arrives. 
            Trained neighbours within a 2km radius, paged instantly when an emergency strikes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg px-8 h-14 rounded-full w-full sm:w-auto shadow-lg shadow-primary/20 hover:scale-105 transition-all">
              Read the Proposal
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 h-14 rounded-full w-full sm:w-auto hover:bg-muted transition-all">
              View Architecture
            </Button>
          </div>
        </motion.div>
      </div>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 mix-blend-multiply" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 mix-blend-multiply" />
      </div>
    </section>
  );
}

function MissionSection() {
  return (
    <section id="mission" className="py-24 px-6 bg-card border-y border-border relative overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="grid md:grid-cols-2 gap-16 items-center"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">The Problem</h2>
            <p className="text-lg text-muted-foreground mb-12 leading-relaxed">
              Our aging population is increasingly living alone in HDB flats. In an emergency, the first 5 minutes decide outcomes. While volunteer goodwill is abundant, it remains fragmented across GRCs in paper forms and uncoordinated chat groups.
            </p>
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-6">The Mission</h2>
            <div className="bg-background border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <p className="text-xl md:text-2xl font-serif font-medium text-foreground italic leading-snug">
                "Equip every neighbourhood with a verified, GPS-aware volunteer network — so that no vulnerable resident faces an emergency alone."
              </p>
            </div>
          </div>
          <div className="grid gap-6">
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="p-6 bg-background shadow-sm border border-border ring-1 ring-border/50 hover:border-primary/50 transition-colors">
                <div className="flex items-start gap-5">
                  <div className="p-4 rounded-xl bg-primary/10 text-primary shadow-inner">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2 tracking-tight">REACH</h3>
                    <p className="text-muted-foreground">Every block, every channel. Web, WhatsApp (lowest barrier for elderly), iOS, and Android.</p>
                  </div>
                </div>
              </Card>
            </motion.div>
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="p-6 bg-background shadow-sm border border-border ring-1 ring-border/50 hover:border-accent/50 transition-colors">
                <div className="flex items-start gap-5">
                  <div className="p-4 rounded-xl bg-accent/10 text-accent shadow-inner">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2 tracking-tight">TRUST</h3>
                    <p className="text-muted-foreground">Verified people, protected data. Strict RBAC, field-level AES-256 encryption, and immutable audit logs.</p>
                  </div>
                </div>
              </Card>
            </motion.div>
            <motion.div whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="p-6 bg-background shadow-sm border border-border ring-1 ring-border/50 hover:border-secondary/50 transition-colors">
                <div className="flex items-start gap-5">
                  <div className="p-4 rounded-xl bg-secondary/10 text-secondary shadow-inner">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl mb-2 tracking-tight">SPEED</h3>
                    <p className="text-muted-foreground">From alert to arrival in minutes. Bridging the gap before SCDF arrives on scene.</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function PipelineSection() {
  return (
    <section id="flows" className="py-24 px-6 relative">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold mb-4">Emergency Response Pipeline</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">From the moment of crisis to resolution, a 6-step orchestrated response.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 relative">
          <div className="hidden md:block absolute top-1/2 left-6 right-6 h-0.5 bg-border -z-10 -translate-y-1/2" />
          
          {[
            { label: "Trigger", icon: <Bell className="w-5 h-5"/>, desc: "SOS pressed" },
            { label: "Classify", icon: <ShieldAlert className="w-5 h-5"/>, desc: "Major / Minor" },
            { label: "Geofence", icon: <MapPin className="w-5 h-5"/>, desc: "≤ 2km radius" },
            { label: "Page", icon: <Smartphone className="w-5 h-5"/>, desc: "Multi-channel" },
            { label: "Respond", icon: <Activity className="w-5 h-5"/>, desc: "Accept / Decline" },
            { label: "Close", icon: <CheckCircle className="w-5 h-5"/>, desc: "Admin only" },
          ].map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center text-center bg-card p-4 rounded-xl border border-border shadow-sm z-10"
            >
              <div className="w-12 h-12 rounded-full bg-background border-2 border-primary text-primary flex items-center justify-center mb-3 shadow-md">
                {step.icon}
              </div>
              <h4 className="font-bold text-foreground mb-1">{step.label}</h4>
              <p className="text-xs text-muted-foreground font-medium">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-20 grid md:grid-cols-2 gap-8">
          <Card className="p-8 border-l-4 border-l-destructive bg-card shadow-md">
            <div className="flex items-center gap-3 mb-4 text-destructive">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-2xl font-bold">Major Emergency</h3>
            </div>
            <p className="text-muted-foreground mb-4">Life-threatening to 2+ people, heavy resources needed (e.g. Fire). Activated by Admin or Reviewer only.</p>
            <div className="bg-destructive/10 text-destructive-foreground p-3 rounded-lg text-sm font-medium mb-4 font-mono">
              "Major emergency on-going. Heavy resources needed."
            </div>
            <ul className="text-sm space-y-2 text-foreground/80">
              <li><strong className="text-foreground">Paging radius:</strong> All volunteers within 2km</li>
              <li><strong className="text-foreground">Deactivation:</strong> Admin only</li>
            </ul>
          </Card>

          <Card className="p-8 border-l-4 border-l-secondary bg-card shadow-md">
            <div className="flex items-center gap-3 mb-4 text-secondary">
              <Info className="w-6 h-6" />
              <h3 className="text-2xl font-bold">Minor Emergency</h3>
            </div>
            <p className="text-muted-foreground mb-4">Single person, conscious, non-fatal. Vulnerable's request for help is automatically classed as Minor.</p>
            <div className="bg-secondary/10 text-secondary-foreground p-3 rounded-lg text-sm font-medium mb-4 font-mono">
              "Minor emergency on-going. Assistance requested."
            </div>
            <ul className="text-sm space-y-2 text-foreground/80">
              <li><strong className="text-foreground">Paging radius:</strong> 2km closest routing</li>
              <li><strong className="text-foreground">Deactivation:</strong> Admin only</li>
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}

function RolesSection() {
  return (
    <section id="roles" className="py-24 px-6 bg-muted/30 border-y border-border">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-serif font-bold text-center mb-16">Four Layers of Responsibility</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              title: "Vulnerable (L1)",
              icon: <HeartPulse className="w-6 h-6" />,
              desc: "Self-registers with next-of-kin, awaits verification, can trigger Minor emergency by requesting help.",
            },
            {
              title: "Volunteer (L2)",
              icon: <Activity className="w-6 h-6" />,
              desc: "Self-registers, mandatory GPS sharing. Receives, accepts, or declines alerts within 2 km. Inherits Vulnerable.",
            },
            {
              title: "Reviewer (L3)",
              icon: <Eye className="w-6 h-6" />,
              desc: "Verifies vulnerable registrations, activates Major emergencies, sees all volunteer & vulnerable data.",
            },
            {
              title: "Admin (L4)",
              icon: <Settings className="w-6 h-6" />,
              desc: "Grants/revokes rights across all roles, sole role authorised to deactivate emergencies. Inherits all.",
            }
          ].map((role, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Card className="p-8 bg-background shadow-md hover:shadow-lg transition-all h-full border border-border">
                <div className="p-3 inline-block rounded-xl bg-primary/10 text-primary mb-6 ring-1 ring-primary/20">
                  {role.icon}
                </div>
                <h3 className="text-xl font-bold mb-4">{role.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{role.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PermissionsSection() {
  return (
    <section className="py-24 px-6 bg-card">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-serif font-bold mb-4">Strict Role-Based Access</h2>
          <p className="text-muted-foreground">Least-privilege architecture enforced at the API level.</p>
        </div>
        <div className="overflow-x-auto pb-4">
          <table className="w-full text-sm text-left border-collapse bg-background rounded-2xl overflow-hidden shadow-xl ring-1 ring-border">
            <thead className="bg-muted text-foreground font-semibold text-sm uppercase tracking-wider">
              <tr>
                <th className="p-5 border-b border-border">Action</th>
                <th className="p-5 border-b border-border text-center">Vulnerable</th>
                <th className="p-5 border-b border-border text-center">Volunteer</th>
                <th className="p-5 border-b border-border text-center text-primary">Reviewer</th>
                <th className="p-5 border-b border-border text-center text-destructive">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                ["Self-register profile", true, true, true, true],
                ["Register next-of-kin", true, true, true, true],
                ["Request help (→ Minor)", true, true, true, true],
                ["Receive emergency alert (≤ 2 km)", false, true, true, true],
                ["Accept/decline alert", false, true, true, true],
                ["View all volunteer & vulnerable details", false, false, true, true],
                ["Verify vulnerable profile", false, false, true, true],
                ["Activate Major emergency", false, false, true, true],
                ["Deactivate emergency", false, false, false, true],
                ["Grant/revoke user rights", false, false, false, true],
              ].map((row, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors group">
                  <td className="p-5 font-medium text-foreground group-hover:text-primary transition-colors">{row[0]}</td>
                  <td className="p-5 text-center">{row[1] ? <div className="w-3 h-3 rounded-full bg-foreground mx-auto shadow-sm"/> : <span className="text-muted-foreground/30">—</span>}</td>
                  <td className="p-5 text-center">{row[2] ? <div className="w-3 h-3 rounded-full bg-foreground mx-auto shadow-sm"/> : <span className="text-muted-foreground/30">—</span>}</td>
                  <td className="p-5 text-center">{row[3] ? <div className="w-3 h-3 rounded-full bg-primary mx-auto shadow-sm ring-2 ring-primary/20"/> : <span className="text-muted-foreground/30">—</span>}</td>
                  <td className="p-5 text-center">{row[4] ? <div className="w-3 h-3 rounded-full bg-destructive mx-auto shadow-sm ring-2 ring-destructive/20"/> : <span className="text-muted-foreground/30">—</span>}</td>
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
    <section className="py-24 px-6 border-y border-border bg-muted/10 relative overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid md:grid-cols-2 gap-20">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary font-bold text-xs uppercase tracking-widest rounded-full mb-6">
              <Activity className="w-4 h-4"/> L2 User
            </div>
            <h2 className="text-3xl font-serif font-bold mb-10">Volunteer Journey</h2>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.125rem] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/50 before:to-transparent">
              {[
                "Anonymous sign-up",
                "Profile + GPS consent",
                "Standby",
                "Alert within 2 km",
                "Dispatch to scene"
              ].map((step, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative flex items-center group"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-primary text-primary font-bold shadow-md z-10 shrink-0 group-hover:scale-110 transition-transform">
                    {i + 1}
                  </div>
                  <div className="ml-6 p-5 rounded-xl border border-border bg-card shadow-sm flex-1 group-hover:border-primary/30 transition-colors">
                    <p className="font-bold text-foreground text-lg">{step}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 text-secondary font-bold text-xs uppercase tracking-widest rounded-full mb-6">
              <HeartPulse className="w-4 h-4"/> L1 User
            </div>
            <h2 className="text-3xl font-serif font-bold mb-10">Vulnerable Journey</h2>
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.125rem] before:h-full before:w-0.5 before:bg-gradient-to-b before:from-secondary/50 before:to-transparent">
              {[
                "Self-register",
                "Next-of-kin details",
                "Reviewer verifies",
                "One-tap request",
                "Help arrives"
              ].map((step, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative flex items-center group"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-background border-2 border-secondary text-secondary font-bold shadow-md z-10 shrink-0 group-hover:scale-110 transition-transform">
                    {i + 1}
                  </div>
                  <div className="ml-6 p-5 rounded-xl border border-border bg-card shadow-sm flex-1 group-hover:border-secondary/30 transition-colors">
                    <p className="font-bold text-foreground text-lg">{step}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MockupsSection() {
  const [volState, setVolState] = useState(0);
  const [vulState, setVulState] = useState(0);

  const volStates = [
    {
      title: "Standby",
      ui: (
        <div className="pt-8 h-full flex flex-col px-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="font-bold text-xl">Good evening,</h3>
              <h3 className="font-bold text-xl text-primary">Wei Ming</h3>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary"><Activity className="w-6 h-6"/></div>
          </div>
          <div className="bg-card border border-border p-5 rounded-2xl shadow-sm mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              <p className="font-bold text-lg">You're on duty</p>
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mb-4"><MapPin className="w-4 h-4"/> GPS sharing active</p>
            <div className="h-px w-full bg-border mb-4"></div>
            <p className="text-xs text-muted-foreground uppercase font-bold mb-2">Current Location</p>
            <p className="font-medium">Blk 207, Jln Besar</p>
          </div>
          <div className="mt-auto mb-6">
            <p className="text-xs text-muted-foreground uppercase font-bold mb-3">Your Skills</p>
            <div className="flex gap-2">
              <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium border border-border">CPR</span>
              <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium border border-border">AED</span>
              <span className="px-3 py-1 bg-muted rounded-full text-xs font-medium border border-border">First-aid</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Alert",
      ui: (
        <div className="pt-8 h-full flex flex-col px-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-destructive text-destructive-foreground p-6 rounded-3xl mb-6 shadow-xl shadow-destructive/20 border border-destructive-foreground/20 relative overflow-hidden flex-1 flex flex-col justify-center">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-2 mb-4 bg-white/20 w-fit px-3 py-1 rounded-full">
              <ShieldAlert className="w-4 h-4" />
              <span className="font-bold tracking-wider text-xs">MAJOR · 380M AWAY</span>
            </div>
            <h4 className="text-3xl font-bold mb-2">Fire reported</h4>
            <p className="text-lg opacity-90 mb-8 font-medium">Heavy resources needed.</p>
            
            <div className="bg-black/20 p-4 rounded-xl mb-8 space-y-3">
              <div className="flex gap-3"><MapPin className="w-5 h-5 shrink-0 opacity-80"/><p className="text-sm font-medium">Blk 211, Jln Besar #04-12</p></div>
              <div className="flex gap-3"><Clock className="w-5 h-5 shrink-0 opacity-80"/><p className="text-sm font-medium">ETA on foot: 4 min</p></div>
              <div className="flex gap-3"><Users className="w-5 h-5 shrink-0 opacity-80"/><p className="text-sm font-medium">9 paged · 3 accepted</p></div>
            </div>

            <div className="mt-auto flex flex-col gap-3">
              <Button className="w-full bg-white text-destructive hover:bg-gray-100 h-14 text-lg font-bold rounded-xl shadow-lg">Accept & Go</Button>
              <Button variant="ghost" className="w-full border border-white/30 text-white hover:bg-white/10 h-14 font-medium rounded-xl">Decline</Button>
            </div>
          </motion.div>
        </div>
      )
    },
    {
      title: "En Route",
      ui: (
        <div className="pt-8 h-full flex flex-col px-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary animate-pulse">
              <ArrowRight className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-xl">Heading to scene</h3>
          </div>
          
          <Card className="p-5 mb-4 shadow-md border-primary/20 bg-primary/5">
            <p className="text-xs text-primary font-bold uppercase mb-1">Destination</p>
            <p className="font-bold text-lg mb-2">Blk 211 #04-12</p>
            <p className="text-sm text-destructive font-medium flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> 3 vulnerable residents on file</p>
          </Card>

          <Card className="p-5 mb-4 shadow-sm border-border">
            <p className="text-xs text-muted-foreground font-bold uppercase mb-3">Scene Notes</p>
            <ul className="space-y-3 text-sm font-medium">
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500"/> SCDF en route</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500"/> Lift active</li>
              <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500"/> Stairwell B clearest</li>
            </ul>
          </Card>

          <div className="mt-auto mb-6 bg-muted p-4 rounded-xl flex items-center justify-between border border-border">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Team</p>
              <p className="font-bold text-lg">4 on scene</p>
            </div>
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => <div key={i} className="w-8 h-8 rounded-full bg-border border-2 border-background flex items-center justify-center text-xs font-bold">{i}</div>)}
            </div>
          </div>
        </div>
      )
    }
  ];

  const vulStates = [
    {
      title: "Home",
      ui: (
        <div className="pt-8 h-full flex flex-col items-center justify-center text-center px-6">
          <h3 className="text-3xl font-serif font-bold mb-3">Hi, Madam Tan</h3>
          <p className="text-lg text-muted-foreground mb-16 font-medium">Press the button if you need help. Help comes to you.</p>
          
          <button className="w-56 h-56 bg-primary rounded-full shadow-[0_0_50px_rgba(var(--primary),0.4)] flex flex-col items-center justify-center text-primary-foreground hover:scale-95 transition-transform active:scale-90 relative overflow-hidden group">
            <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-[0%] transition-transform duration-500"></div>
            <Bell className="w-16 h-16 mb-2 relative z-10" />
            <span className="font-bold text-4xl tracking-wider relative z-10">SOS</span>
          </button>

          <div className="mt-20 w-full text-left bg-card p-5 rounded-2xl border border-border shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <Phone className="w-5 h-5 text-muted-foreground"/>
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Next of Kin on file</p>
            </div>
            <p className="font-bold text-lg">Tan Wei Ling</p>
            <p className="text-sm text-muted-foreground">Daughter</p>
          </div>
        </div>
      )
    },
    {
      title: "Confirm",
      ui: (
        <div className="pt-8 h-full flex flex-col px-6">
          <h3 className="text-2xl font-bold mb-4">Send for help?</h3>
          <p className="text-muted-foreground mb-8 text-lg leading-snug">We will alert your trained neighbours within 2 km and your next-of-kin.</p>
          
          <Card className="p-5 mb-8 bg-muted border-border">
            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Your Location</p>
            <p className="font-bold text-lg mb-4">Blk 207 #06-22</p>
            <p className="text-xs font-bold uppercase text-muted-foreground mb-1">Situation</p>
            <p className="font-bold text-lg text-secondary">I have fallen — I am conscious.</p>
          </Card>

          <div className="mt-auto mb-8 space-y-4">
            <Button className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 text-white rounded-2xl shadow-lg shadow-primary/20">Yes, send help</Button>
            <Button variant="outline" className="w-full h-14 text-lg font-bold rounded-2xl">Cancel</Button>
          </div>
        </div>
      )
    },
    {
      title: "Coming",
      ui: (
        <div className="pt-12 h-full flex flex-col px-6 text-center">
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h3 className="text-3xl font-bold mb-2">Help is coming</h3>
          <p className="text-xl text-muted-foreground mb-12">Stay calm. Stay where you are.</p>
          
          <Card className="p-6 mb-8 border-primary/20 bg-card shadow-lg text-left">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">3</div>
              <div>
                <p className="font-bold text-lg">Neighbours en route</p>
                <p className="text-sm text-muted-foreground">Closest is 280m away</p>
              </div>
            </div>
            <div className="bg-muted p-3 rounded-lg flex justify-between items-center">
              <span className="font-bold">ETA</span>
              <span className="font-bold text-xl text-primary">3 min</span>
            </div>
          </Card>

          <div className="space-y-4 text-left px-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white"><CheckCircle className="w-4 h-4"/></div>
              <span className="font-bold text-foreground">Next-of-kin notified</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white"><CheckCircle className="w-4 h-4"/></div>
              <span className="font-bold text-foreground">SCDF notified</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <section id="mockups" className="py-24 px-6 bg-background">
      <div className="container mx-auto max-w-6xl">
        <h2 className="text-4xl font-serif font-bold text-center mb-6">Designed for Urgency</h2>
        <p className="text-xl text-muted-foreground text-center max-w-2xl mx-auto mb-16">High-contrast, large touch targets, and clear hierarchy. Mobile-native interfaces for people under stress.</p>
        
        <div className="flex flex-col lg:flex-row gap-16 justify-center items-center mb-32">
          
          {/* Volunteer Device */}
          <div className="flex flex-col items-center">
            <div className="flex gap-2 mb-6 p-1 bg-muted rounded-full">
              {volStates.map((s, i) => (
                <button key={i} onClick={() => setVolState(i)} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${volState === i ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {s.title}
                </button>
              ))}
            </div>
            <div className="w-[340px] h-[720px] bg-background rounded-[3rem] ring-[12px] ring-muted p-2 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-14 flex justify-center items-center bg-background z-20">
                <div className="w-32 h-6 bg-muted rounded-full"></div>
              </div>
              <div className="h-full bg-background rounded-[2.5rem] overflow-hidden border border-border">
                <AnimatePresence mode="wait">
                  <motion.div key={volState} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
                    {volStates[volState].ui}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            <p className="mt-8 font-serif font-bold text-xl">Volunteer App</p>
          </div>

          {/* Vulnerable Device */}
          <div className="flex flex-col items-center">
            <div className="flex gap-2 mb-6 p-1 bg-muted rounded-full">
              {vulStates.map((s, i) => (
                <button key={i} onClick={() => setVulState(i)} className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${vulState === i ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                  {s.title}
                </button>
              ))}
            </div>
            <div className="w-[340px] h-[720px] bg-background rounded-[3rem] ring-[12px] ring-muted p-2 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-14 flex justify-center items-center bg-background z-20">
                <div className="w-32 h-6 bg-muted rounded-full"></div>
              </div>
              <div className="h-full bg-background rounded-[2.5rem] overflow-hidden border border-border">
                <AnimatePresence mode="wait">
                  <motion.div key={vulState} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full bg-card">
                    {vulStates[vulState].ui}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            <p className="mt-8 font-serif font-bold text-xl text-secondary">Vulnerable App</p>
          </div>

        </div>

        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-3xl font-serif font-bold">Admin Console</h3>
            <p className="text-muted-foreground mt-2">Dense, data-rich command center for GRC reviewers.</p>
          </div>
          {/* Admin Console Mockup */}
          <div className="rounded-2xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col ring-1 ring-border">
            <div className="h-12 border-b border-border flex items-center px-4 gap-4 bg-muted/50">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/60 hover:bg-destructive transition-colors"></div>
                <div className="w-3 h-3 rounded-full bg-secondary/60 hover:bg-secondary transition-colors"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/60 hover:bg-green-500 transition-colors"></div>
              </div>
              <div className="flex items-center gap-2 font-serif font-bold text-sm ml-4">
                <Flame className="w-4 h-4 text-primary" /> Fire Kaki Admin
              </div>
              <div className="ml-auto w-64 h-7 bg-background border border-border rounded-md flex items-center px-3 text-xs text-muted-foreground">Search residents...</div>
            </div>
            <div className="flex flex-1 h-[600px]">
              <div className="w-56 border-r border-border p-4 bg-muted/20 hidden sm:block flex-shrink-0">
                <div className="space-y-1 mb-8">
                  <div className="text-sm font-bold py-2 px-3 rounded-lg bg-primary/10 text-primary flex items-center gap-2"><Activity className="w-4 h-4"/> Overview</div>
                  <div className="text-sm font-medium text-muted-foreground py-2 px-3 hover:bg-muted rounded-lg cursor-pointer flex items-center gap-2"><Eye className="w-4 h-4"/> Verifications</div>
                  <div className="text-sm font-medium text-muted-foreground py-2 px-3 hover:bg-muted rounded-lg cursor-pointer flex items-center gap-2"><Users className="w-4 h-4"/> Volunteers</div>
                  <div className="text-sm font-medium text-muted-foreground py-2 px-3 hover:bg-muted rounded-lg cursor-pointer flex items-center gap-2"><HeartPulse className="w-4 h-4"/> Vulnerable</div>
                  <div className="text-sm font-medium text-muted-foreground py-2 px-3 hover:bg-muted rounded-lg cursor-pointer flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Live emergencies</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-3 mb-2">System</div>
                  <div className="text-sm font-medium text-muted-foreground py-2 px-3 hover:bg-muted rounded-lg cursor-pointer">Audit log</div>
                  <div className="text-sm font-medium text-muted-foreground py-2 px-3 hover:bg-muted rounded-lg cursor-pointer">User rights</div>
                  <div className="text-sm font-medium text-muted-foreground py-2 px-3 hover:bg-muted rounded-lg cursor-pointer">Settings</div>
                </div>
              </div>
              <div className="flex-1 p-8 overflow-y-auto bg-background">
                <div className="grid grid-cols-4 gap-6 mb-8">
                  <div className="p-5 border border-border rounded-xl bg-card shadow-sm">
                    <p className="text-3xl font-bold mb-1">312</p>
                    <p className="text-sm text-muted-foreground font-medium">Vulnerable Verified</p>
                  </div>
                  <div className="p-5 border border-border rounded-xl bg-card shadow-sm">
                    <p className="text-3xl font-bold mb-1">874</p>
                    <p className="text-sm text-muted-foreground font-medium">Volunteers Active</p>
                  </div>
                  <div className="p-5 border-none rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20"><AlertTriangle className="w-12 h-12"/></div>
                    <p className="text-3xl font-bold mb-1 relative z-10">2</p>
                    <p className="text-sm font-medium relative z-10">Live Emergencies</p>
                  </div>
                  <div className="p-5 border border-border rounded-xl bg-card shadow-sm">
                    <p className="text-3xl font-bold mb-1 text-green-600">98%</p>
                    <p className="text-sm text-muted-foreground font-medium">Coverage ≤ 2km</p>
                  </div>
                </div>
                
                <h4 className="text-lg font-bold mb-4">Verification Queue</h4>
                <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted border-b border-border text-xs uppercase tracking-wider font-bold text-muted-foreground">
                      <tr>
                        <th className="px-5 py-4">Resident</th>
                        <th className="px-5 py-4">Address</th>
                        <th className="px-5 py-4">Next of Kin</th>
                        <th className="px-5 py-4">Date</th>
                        <th className="px-5 py-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      <tr className="hover:bg-muted/30">
                        <td className="px-5 py-4 font-bold text-foreground">Tan Ah Mui (82·F)</td>
                        <td className="px-5 py-4 text-muted-foreground">Blk 207 #06-22</td>
                        <td className="px-5 py-4 text-muted-foreground">Tan Wei Ling · Daughter</td>
                        <td className="px-5 py-4 text-muted-foreground">2 May</td>
                        <td className="px-5 py-4"><span className="px-2.5 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-md text-xs font-bold tracking-wide">PENDING</span></td>
                      </tr>
                      <tr className="hover:bg-muted/30">
                        <td className="px-5 py-4 font-bold text-foreground">Mohammed Ismail (79·M)</td>
                        <td className="px-5 py-4 text-muted-foreground">Blk 211 #04-12</td>
                        <td className="px-5 py-4 text-muted-foreground">F. Ismail · Son</td>
                        <td className="px-5 py-4 text-muted-foreground">2 May</td>
                        <td className="px-5 py-4"><span className="px-2.5 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-md text-xs font-bold tracking-wide">PENDING</span></td>
                      </tr>
                      <tr className="hover:bg-muted/30">
                        <td className="px-5 py-4 font-bold text-foreground">Lim Geok Hua (85·F)</td>
                        <td className="px-5 py-4 text-muted-foreground">Blk 219 #11-08</td>
                        <td className="px-5 py-4 text-muted-foreground">-</td>
                        <td className="px-5 py-4 text-muted-foreground">3 May</td>
                        <td className="px-5 py-4"><span className="px-2.5 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-md text-xs font-bold tracking-wide">PENDING</span></td>
                      </tr>
                      <tr className="bg-primary/5 hover:bg-primary/10">
                        <td className="px-5 py-4 font-bold text-foreground flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>Krishnan Devi (76·F)</td>
                        <td className="px-5 py-4 text-muted-foreground">Blk 222 #02-15</td>
                        <td className="px-5 py-4 text-muted-foreground">K. Kumar · Son</td>
                        <td className="px-5 py-4 text-muted-foreground">4 May</td>
                        <td className="px-5 py-4"><span className="px-2.5 py-1 bg-primary text-primary-foreground shadow-sm shadow-primary/30 rounded-md text-xs font-bold tracking-wide">LIVE · MINOR</span></td>
                      </tr>
                      <tr className="hover:bg-muted/30">
                        <td className="px-5 py-4 font-bold text-foreground">Goh Ah Seng (81·M)</td>
                        <td className="px-5 py-4 text-muted-foreground">Blk 225 #09-04</td>
                        <td className="px-5 py-4 text-muted-foreground">G. Mui Choo · Wife</td>
                        <td className="px-5 py-4 text-muted-foreground">5 May</td>
                        <td className="px-5 py-4"><span className="px-2.5 py-1 bg-green-500/10 text-green-700 border border-green-500/20 rounded-md text-xs font-bold tracking-wide">VERIFIED</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ArchitectureSection() {
  return (
    <section id="architecture" className="py-24 px-6 border-y border-border">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold mb-4">System Architecture</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">A modern, secure, 4-tier stack designed for national resilience.</p>
        </div>
        
        <div className="flex flex-col gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl border-2 border-border bg-card shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-muted-foreground/30" />
            <div className="w-40 text-center md:text-right font-bold text-muted-foreground uppercase tracking-widest text-sm shrink-0">L1 Channels</div>
            <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
              <div className="p-4 text-center rounded-xl border border-border bg-background shadow-sm text-sm font-bold">Website (React)</div>
              <div className="p-4 text-center rounded-xl border border-green-500/30 bg-green-500/10 text-green-700 text-sm font-bold shadow-sm">WhatsApp API</div>
              <div className="p-4 text-center rounded-xl border border-border bg-background shadow-sm text-sm font-bold">iOS (Swift)</div>
              <div className="p-4 text-center rounded-xl border border-border bg-background shadow-sm text-sm font-bold">Android (Kotlin)</div>
            </div>
          </motion.div>
          
          <div className="flex justify-center -my-2"><ArrowRight className="w-8 h-8 text-muted-foreground rotate-90" /></div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl border-2 border-accent/30 bg-accent/5 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-accent" />
            <div className="w-40 text-center md:text-right font-bold text-accent uppercase tracking-widest text-sm shrink-0">L2 Edge</div>
            <div className="flex-1 flex flex-wrap gap-4 justify-center md:justify-start w-full">
              <span className="px-5 py-2.5 bg-background border border-accent/20 rounded-full text-sm font-bold shadow-sm">API Gateway</span>
              <span className="px-5 py-2.5 bg-background border border-accent/20 rounded-full text-sm font-bold shadow-sm">OAuth2 MFA</span>
              <span className="px-5 py-2.5 bg-background border border-accent/20 rounded-full text-sm font-bold shadow-sm">Rate Limiting</span>
              <span className="px-5 py-2.5 bg-background border border-accent/20 rounded-full text-sm font-bold shadow-sm">WAF (OWASP Top 10)</span>
            </div>
          </motion.div>

          <div className="flex justify-center -my-2"><ArrowRight className="w-8 h-8 text-accent/50 rotate-90" /></div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl border-2 border-secondary/30 bg-secondary/5 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-secondary" />
            <div className="w-40 text-center md:text-right font-bold text-secondary-foreground uppercase tracking-widest text-sm shrink-0">L3 Services</div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              <div className="p-5 rounded-xl bg-background border border-secondary/20 shadow-sm flex items-center gap-4">
                <Lock className="text-secondary w-6 h-6"/> <span className="font-bold text-foreground">Identity & RBAC</span>
              </div>
              <div className="p-5 rounded-xl bg-background border border-secondary/20 shadow-sm flex items-center gap-4">
                <MapPin className="text-secondary w-6 h-6"/> <span className="font-bold text-foreground">Geofence Engine (2km)</span>
              </div>
              <div className="p-5 rounded-xl bg-background border border-secondary/20 shadow-sm flex items-center gap-4">
                <Activity className="text-secondary w-6 h-6"/> <span className="font-bold text-foreground">Emergency Dispatcher</span>
              </div>
              <div className="p-5 rounded-xl bg-background border border-secondary/20 shadow-sm flex items-center gap-4">
                <Bell className="text-secondary w-6 h-6"/> <span className="font-bold text-foreground">Notification Fanout</span>
              </div>
            </div>
          </motion.div>

          <div className="flex justify-center -my-2"><ArrowRight className="w-8 h-8 text-secondary/50 rotate-90" /></div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="p-8 rounded-2xl border-2 border-primary/30 bg-primary/5 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-primary" />
            <div className="w-40 text-center md:text-right font-bold text-primary uppercase tracking-widest text-sm shrink-0">L4 Data</div>
            <div className="flex-1 grid grid-cols-2 gap-4 w-full">
              <div className="p-5 rounded-xl bg-background border border-primary/20 shadow-sm flex items-center gap-3">
                <Database className="w-5 h-5 text-primary"/> <span className="font-bold text-foreground">PII Vault (AES-256)</span>
              </div>
              <div className="p-5 rounded-xl bg-background border border-primary/20 shadow-sm flex items-center gap-3">
                <Server className="w-5 h-5 text-primary"/> <span className="font-bold text-foreground">Audit Ledger</span>
              </div>
              <div className="p-5 rounded-xl bg-background border border-primary/10 shadow-sm flex items-center gap-3">
                <MapPin className="w-5 h-5 text-muted-foreground"/> <span className="font-bold text-muted-foreground">GPS (24h expiry)</span>
              </div>
              <div className="p-5 rounded-xl bg-background border border-primary/10 shadow-sm flex items-center gap-3">
                <HeartPulse className="w-5 h-5 text-muted-foreground"/> <span className="font-bold text-muted-foreground">Health Vault</span>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section id="security" className="py-24 px-6 bg-foreground text-background">
      <div className="container mx-auto max-w-5xl text-center">
        <Shield className="w-16 h-16 mx-auto mb-8 text-primary" />
        <h2 className="text-4xl font-serif font-bold mb-16 text-background">Gov-Grade Data Security</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-12 text-left">
          <div className="space-y-4">
            <Lock className="w-8 h-8 text-secondary" />
            <h4 className="font-bold text-xl text-background">Encryption & Privacy</h4>
            <p className="text-background/70 font-medium leading-relaxed">TLS 1.3 in transit + AES-256 field-level encryption at rest. Fully PDPA-aligned, ensuring only Singapore-resident data.</p>
          </div>
          <div className="space-y-4">
            <Settings className="w-8 h-8 text-secondary" />
            <h4 className="font-bold text-xl text-background">Access Control</h4>
            <p className="text-background/70 font-medium leading-relaxed">Least-privilege RBAC enforced strictly at the API layer. MFA is mandatory for Admins; biometrics for mobile responders.</p>
          </div>
          <div className="space-y-4">
            <Eye className="w-8 h-8 text-secondary" />
            <h4 className="font-bold text-xl text-background">Auditing & Lifecycle</h4>
            <p className="text-background/70 font-medium leading-relaxed">Immutable append-only ledger for every PII read. Volunteer GPS data auto-expires every 24h. Annual pen tests.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoadmapSection() {
  return (
    <section id="roadmap" className="py-24 px-6 bg-card border-b border-border">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-bold mb-4">The Road to Scale</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">From a single neighbourhood to a national shield.</p>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { phase: "Q3 2026", title: "Pilot", desc: "One GRC, web+WA+app, 4-role MVP, 500 vulnerable residents / 1.5k volunteers.", active: true },
            { phase: "Q1 2027", title: "Mobile + Multi-GRC", desc: "iOS & Android native apps, 4 languages (EN·ZH·MS·TA), SCDF myResponder integration, 3 GRCs.", active: false },
            { phase: "Q3 2027", title: "Smart Escalation", desc: "Wearable fall-detection ingest, skill-aware routing, drill mode, voice-activated SOS.", active: false },
            { phase: "2028+", title: "National Scale", desc: "All 17 GRCs & SMCs, cross-GRC mobility, public transparency, open API for VWOs.", active: false },
          ].map((item, i) => (
            <div key={i} className={`relative pl-8 border-l-[3px] pb-12 ${item.active ? 'border-primary' : 'border-border'}`}>
              <div className={`absolute w-5 h-5 rounded-full -left-[11px] top-0 border-4 border-card shadow-sm ${item.active ? 'bg-primary' : 'bg-muted-foreground'}`}></div>
              <h4 className={`font-bold text-xl mb-1 ${item.active ? 'text-foreground' : 'text-muted-foreground'}`}>{item.phase}</h4>
              <p className={`font-bold text-sm mb-4 uppercase tracking-widest ${item.active ? 'text-primary' : 'text-foreground'}`}>{item.title}</p>
              <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-32 px-6 bg-muted/30 text-center relative overflow-hidden">
      <div className="container mx-auto max-w-4xl relative z-10">
        <h2 className="text-5xl md:text-6xl font-serif font-bold mb-8">Partner with us.</h2>
        <p className="text-xl md:text-2xl text-muted-foreground mb-16 font-medium leading-relaxed">
          The Jalan Besar pilot proved that neighbours save lives. Now it's time to build the infrastructure to scale that humanity.
        </p>
        <div className="grid sm:grid-cols-3 gap-8 mb-16 text-left">
          <Card className="p-8 bg-background border border-border hover:border-primary/50 transition-colors shadow-sm">
            <h4 className="font-bold text-xl mb-3 text-primary">A Pilot GRC</h4>
            <p className="text-muted-foreground font-medium">For a 9-month scale-up building on the initial pilot success.</p>
          </Card>
          <Card className="p-8 bg-background border border-border hover:border-primary/50 transition-colors shadow-sm">
            <h4 className="font-bold text-xl mb-3 text-primary">An SCDF Bridge</h4>
            <p className="text-muted-foreground font-medium">Working-level access to align technically with SCDF myResponder.</p>
          </Card>
          <Card className="p-8 bg-background border border-border hover:border-primary/50 transition-colors shadow-sm">
            <h4 className="font-bold text-xl mb-3 text-primary">Data Framework</h4>
            <p className="text-muted-foreground font-medium">Joint security and privacy review with IMDA & PDPC.</p>
          </Card>
        </div>
        <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 text-xl px-12 h-16 rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-all font-bold">
          Take the Meeting
        </Button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-16 px-6 bg-background border-t border-border">
      <div className="container mx-auto max-w-6xl flex flex-col md:flex-row justify-between items-start md:items-center gap-8 text-sm font-medium text-muted-foreground">
        <div>
          <div className="flex items-center gap-2 font-serif font-bold text-foreground text-xl mb-4">
            <Flame className="w-6 h-6 text-primary" /> Fire Kaki
          </div>
          <p>Community Safety Network Proposal</p>
        </div>
        <div className="text-left md:text-right space-y-2">
          <p className="text-foreground">Author: Ang See Siang · May 2026</p>
          <p className="text-xs opacity-80 uppercase tracking-widest pt-2 border-t border-border/50">Inspired by the Jalan Besar Fire Safety Kakis</p>
        </div>
      </div>
    </footer>
  );
}
