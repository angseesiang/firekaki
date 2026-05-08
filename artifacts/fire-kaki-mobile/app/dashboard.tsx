import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Platform, Pressable, View } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Screen } from "@/components/Screen";
import { Body, Button, Card, EmptyState, FONT, Heading, MonoLabel, Muted, Pill, Section } from "@/components/ui";
import { SosButton } from "@/components/SosButton";
import { EmergencyCard } from "@/components/EmergencyCard";
import { ResponderStatus } from "@/components/ResponderStatus";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { useLocationTracker } from "@/hooks/useLocationTracker";
import {
  arriveEmergency,
  createEmergency,
  deactivateEmergency,
  getNokMe,
  getVulnerableMe,
  listEmergencies,
  listPendingVulnerable,
  respondEmergency,
  updateVolunteerLocation,
  updateVulnerableLocation,
  verifyVolunteer,
  verifyVulnerable,
  type Emergency,
} from "@/lib/api";
import { formatDate, roleLabel } from "@/lib/format";

const POLL_MS = 8000;
const EMERGENCIES_KEY = ["emergencies"] as const;
const PENDING_KEY = ["reviewer-pending"] as const;
const VULNERABLE_ME_KEY = ["vulnerable-me"] as const;
const NOK_ME_KEY = ["nok-me"] as const;

export default function DashboardScreen() {
  const { user, status, logout } = useAuth();
  const c = useColors();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status]);

  if (!user) {
    return (
      <Screen contentStyle={{ justifyContent: "center", alignItems: "center" }}>
        <Muted>Loading…</Muted>
      </Screen>
    );
  }

  return (
    <Screen
      contentStyle={{ gap: 22 }}
      noTopPadding={false}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="flame" size={18} color={c.primary} />
            <MonoLabel>Fire Kaki · {roleLabel(user.role)}</MonoLabel>
          </View>
          <Heading style={{ fontSize: 28 }}>
            {user.role === "vulnerable" ? `Hi, ${user.name}` : `Welcome, ${user.name}`}
          </Heading>
        </View>
        <Pressable
          onPress={() => {
            if (Platform.OS === "web") {
              if (typeof window !== "undefined" && window.confirm("End your session?")) {
                void logout();
              }
              return;
            }
            Alert.alert("Sign out", "End your session?", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign out", style: "destructive", onPress: () => void logout() },
            ]);
          }}
          hitSlop={12}
        >
          <Ionicons name="log-out-outline" size={26} color={c.foreground} />
        </Pressable>
      </View>

      {user.role === "vulnerable" ? <VulnerablePanel /> : null}
      {user.role === "volunteer" ? <VolunteerPanel /> : null}
      {user.role === "reviewer" || user.role === "admin" ? <ReviewerAdminPanel isAdmin={user.role === "admin"} /> : null}
      {user.role === "nok" ? <NokPanel /> : null}
    </Screen>
  );
}

/* -------------------- Vulnerable -------------------- */

function VulnerablePanel() {
  const c = useColors();
  const qc = useQueryClient();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const meQ = useQuery({ queryKey: VULNERABLE_ME_KEY, queryFn: () => getVulnerableMe() });
  const emergenciesQ = useQuery({
    queryKey: EMERGENCIES_KEY,
    queryFn: () => listEmergencies(),
    refetchInterval: POLL_MS,
  });

  const updateLocation = useMutation({
    mutationFn: (body: { lat: number; lng: number }) => updateVulnerableLocation(body),
  });

  const create = useMutation({
    mutationFn: () =>
      createEmergency({
        type: "minor",
        ...(coords ? { lat: coords.lat, lng: coords.lng } : {}),
        ...(meQ.data?.address ? { address: meQ.data.address } : {}),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMERGENCIES_KEY }),
  });

  const tracker = useLocationTracker({
    enabled: true,
    onUpdate: (c) => {
      setCoords({ lat: c.lat, lng: c.lng });
      updateLocation.mutate({ lat: c.lat, lng: c.lng });
    },
  });

  const myActive = (emergenciesQ.data?.emergencies ?? []).find(
    (e) => e.status === "active" && e.creatorUserId === meQ.data?.id,
  );

  const sosState: "ready" | "active" | "no-gps" = myActive
    ? "active"
    : !coords
      ? "no-gps"
      : "ready";

  function handleSos() {
    if (myActive) {
      Alert.alert(
        "Help is already on the way",
        "Stay safe. Your kakis have been notified.",
      );
      return;
    }
    Alert.alert(
      "Send SOS?",
      "Your nearby kakis will be alerted with your location.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Send SOS", style: "destructive", onPress: () => create.mutate() },
      ],
    );
  }

  return (
    <View style={{ gap: 22 }}>
      <View style={{ alignItems: "center", paddingVertical: 20, gap: 18 }}>
        <SosButton state={sosState} loading={create.isPending} onPress={handleSos} />
        {tracker.status === "denied" ? (
          <Muted style={{ textAlign: "center", color: c.destructive }}>
            Location permission is needed so your kakis can find you. Enable it in Settings.
          </Muted>
        ) : tracker.status === "requesting" ? (
          <Muted>Asking for location…</Muted>
        ) : null}
      </View>

      {myActive ? (
        <View style={{ gap: 12 }}>
          <ResponderStatus emergency={myActive} />
          <Button
            label="I'm safe — close request"
            variant="outline"
            onPress={() =>
              Alert.alert("Mark as resolved?", "Only do this when you're safe.", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "I'm safe",
                  onPress: async () => {
                    try {
                      await deactivateEmergency(myActive.id);
                      qc.invalidateQueries({ queryKey: EMERGENCIES_KEY });
                    } catch (err) {
                      Alert.alert("Couldn't close request", err instanceof Error ? err.message : String(err));
                    }
                  },
                },
              ])
            }
          />
        </View>
      ) : null}

      {meQ.data ? (
        <Section title="Your details">
          <Card style={{ gap: 8 }}>
            <Row label="Address" value={meQ.data.address} />
            <Row label="Next of kin" value={meQ.data.nokName || "—"} />
            <Row label="NOK contact" value={meQ.data.nokContact || "—"} />
            <Row label="Verified" value={meQ.data.verified ? "Yes" : "Pending"} />
          </Card>
        </Section>
      ) : null}

      <Button
        label="Past requests"
        variant="outline"
        onPress={() => router.push("/my-requests")}
      />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
      <Muted style={{ flex: 0 }}>{label}</Muted>
      <Body style={{ flex: 1, textAlign: "right", color: c.foreground }}>
        {value}
      </Body>
    </View>
  );
}

/* -------------------- Volunteer -------------------- */

function VolunteerPanel() {
  const c = useColors();
  const qc = useQueryClient();
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const updateLocation = useMutation({
    mutationFn: (body: { lat: number; lng: number }) => updateVolunteerLocation(body),
  });

  const tracker = useLocationTracker({
    enabled: true,
    onUpdate: (c) => {
      setCoords({ lat: c.lat, lng: c.lng });
      updateLocation.mutate({ lat: c.lat, lng: c.lng });
    },
  });

  const emergenciesQ = useQuery({
    queryKey: EMERGENCIES_KEY,
    queryFn: () => listEmergencies(),
    refetchInterval: POLL_MS,
  });

  const respond = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "accepted" | "declined" }) =>
      respondEmergency(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMERGENCIES_KEY }),
  });

  const arrive = useMutation({
    mutationFn: (id: number) => arriveEmergency(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMERGENCIES_KEY }),
  });

  const active = (emergenciesQ.data?.emergencies ?? []).filter((e) => e.status === "active");

  return (
    <View style={{ gap: 18 }}>
      <Card tone="muted" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Ionicons
          name={tracker.status === "tracking" ? "location" : "location-outline"}
          size={20}
          color={tracker.status === "tracking" ? c.primary : c.mutedForeground}
        />
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: "600" }}>
            {tracker.status === "tracking"
              ? "Sharing your location"
              : tracker.status === "denied"
                ? "Location permission denied"
                : "Setting up location…"}
          </Body>
          <Muted>
            {coords
              ? `Lat ${coords.lat.toFixed(4)}, Lng ${coords.lng.toFixed(4)}`
              : "Volunteers within 2 km of an SOS get notified."}
          </Muted>
        </View>
      </Card>

      <Section title="Active calls" subtitle="Live SOS within your radius">
        {active.length === 0 ? (
          <EmptyState
            title="All clear right now"
            subtitle="When a neighbour calls SOS, it will appear here."
          />
        ) : (
          <View style={{ gap: 12 }}>
            {active.map((e) => (
              <EmergencyCard
                key={e.id}
                emergency={e}
                primaryAction={
                  e.myResponse === "accepted"
                    ? e.myArrivedAt
                      ? undefined
                      : {
                          label: "I've arrived",
                          variant: "primary",
                          loading: arrive.isPending && arrive.variables === e.id,
                          onPress: () => arrive.mutate(e.id),
                        }
                    : {
                        label: "Accept",
                        variant: "primary",
                        loading:
                          respond.isPending &&
                          respond.variables?.id === e.id &&
                          respond.variables.status === "accepted",
                        onPress: () => respond.mutate({ id: e.id, status: "accepted" }),
                      }
                }
                secondaryAction={
                  e.myResponse === "accepted"
                    ? {
                        label: "Stand down",
                        variant: "outline",
                        onPress: () => respond.mutate({ id: e.id, status: "declined" }),
                      }
                    : e.myResponse === "declined"
                      ? undefined
                      : {
                          label: "Decline",
                          variant: "outline",
                          onPress: () => respond.mutate({ id: e.id, status: "declined" }),
                        }
                }
                footer={
                  e.myResponse ? (
                    <Pill
                      label={`You ${e.myResponse}${e.myArrivedAt ? " · arrived" : ""}`}
                      tone={e.myResponse === "accepted" ? "success" : "muted"}
                    />
                  ) : undefined
                }
              />
            ))}
          </View>
        )}
      </Section>
    </View>
  );
}

/* -------------------- Reviewer / Admin -------------------- */

function ReviewerAdminPanel({ isAdmin }: { isAdmin: boolean }) {
  const c = useColors();
  const qc = useQueryClient();
  const [activatingMajor, setActivatingMajor] = useState(false);

  const emergenciesQ = useQuery({
    queryKey: EMERGENCIES_KEY,
    queryFn: () => listEmergencies(),
    refetchInterval: POLL_MS,
  });
  const pendingQ = useQuery({
    queryKey: PENDING_KEY,
    queryFn: () => listPendingVulnerable(),
    refetchInterval: POLL_MS * 2,
  });

  const verifyVuln = useMutation({
    mutationFn: (id: number) => verifyVulnerable(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: PENDING_KEY }),
  });
  const deactivate = useMutation({
    mutationFn: (id: number) => deactivateEmergency(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMERGENCIES_KEY }),
  });

  const tracker = useLocationTracker({ enabled: true });

  async function activateMajor() {
    setActivatingMajor(true);
    try {
      await createEmergency({
        type: "major",
        ...(tracker.coords
          ? { lat: tracker.coords.lat, lng: tracker.coords.lng }
          : {}),
        description: "Major incident — all kakis on standby",
      });
      qc.invalidateQueries({ queryKey: EMERGENCIES_KEY });
    } catch (err) {
      Alert.alert("Couldn't activate", err instanceof Error ? err.message : String(err));
    } finally {
      setActivatingMajor(false);
    }
  }

  const active = (emergenciesQ.data?.emergencies ?? []).filter((e) => e.status === "active");
  const recent = (emergenciesQ.data?.emergencies ?? []).filter((e) => e.status !== "active").slice(0, 5);
  const pending = pendingQ.data?.items ?? [];

  return (
    <View style={{ gap: 18 }}>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <StatCard label="Active SOS" value={active.length} tone="primary" />
        <StatCard label="Pending verifications" value={pending.length} tone="warn" />
      </View>

      <Card tone="primary" style={{ gap: 12 }}>
        <Body style={{ color: "#fff", fontFamily: FONT.serif, fontSize: 22 }}>
          Activate major incident
        </Body>
        <Body style={{ color: "#fff", opacity: 0.9 }}>
          Calls every kaki to standby. Use only for serious events.
        </Body>
        <Button
          label="Activate Major"
          onPress={() =>
            Alert.alert("Activate major?", "All kakis will be alerted.", [
              { text: "Cancel", style: "cancel" },
              { text: "Activate", style: "destructive", onPress: activateMajor },
            ])
          }
          loading={activatingMajor}
          variant="secondary"
        />
      </Card>

      <Section title="Verification queue" subtitle="Tap Verify to approve a resident">
        {pending.length === 0 ? (
          <EmptyState title="Nothing to review" subtitle="All residents are verified." />
        ) : (
          <View style={{ gap: 10 }}>
            {pending.map((p) => (
              <Card key={p.id} style={{ gap: 8 }}>
                <Body style={{ fontWeight: "700" }}>{p.name}</Body>
                <Muted>{p.email}</Muted>
                <Muted>{p.address}</Muted>
                <Muted>NOK: {p.nokName || "—"} · {p.nokContact || "—"}</Muted>
                <Button
                  label="Verify resident"
                  loading={verifyVuln.isPending && verifyVuln.variables === p.id}
                  onPress={() => verifyVuln.mutate(p.id)}
                />
              </Card>
            ))}
          </View>
        )}
      </Section>

      <Section title="Live emergencies" subtitle="Real-time SOS feed">
        {active.length === 0 ? (
          <EmptyState title="No active calls" subtitle="The neighbourhood is quiet right now." />
        ) : (
          <View style={{ gap: 12 }}>
            {active.map((e) => (
              <EmergencyCard
                key={e.id}
                emergency={e}
                showResponderStats
                primaryAction={
                  isAdmin
                    ? {
                        label: "Deactivate",
                        variant: "destructive",
                        loading: deactivate.isPending && deactivate.variables === e.id,
                        onPress: () =>
                          Alert.alert("Deactivate this SOS?", "This will close the alert.", [
                            { text: "Cancel", style: "cancel" },
                            { text: "Deactivate", style: "destructive", onPress: () => deactivate.mutate(e.id) },
                          ]),
                      }
                    : undefined
                }
              />
            ))}
          </View>
        )}
      </Section>

      {recent.length > 0 ? (
        <Section title="Recent">
          <View style={{ gap: 10 }}>
            {recent.map((e) => (
              <EmergencyCard key={e.id} emergency={e} showResponderStats />
            ))}
          </View>
        </Section>
      ) : null}

      <Button label="Manage users" variant="outline" onPress={() => router.push("/manage")} />
    </View>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "primary" | "warn" | "muted" }) {
  const c = useColors();
  const palette: Record<string, { bg: string; fg: string; sub: string }> = {
    primary: { bg: c.primary, fg: "#fff", sub: "rgba(255,255,255,0.8)" },
    warn: { bg: c.secondary, fg: "#fff", sub: "rgba(255,255,255,0.85)" },
    muted: { bg: c.muted, fg: c.foreground, sub: c.mutedForeground },
  };
  const p = palette[tone];
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: p.bg,
        borderRadius: c.radius + 4,
        padding: 16,
        gap: 6,
      }}
    >
      <Body style={{ color: p.sub, fontFamily: FONT.sansSemibold, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.6 }}>
        {label}
      </Body>
      <Body style={{ color: p.fg, fontFamily: FONT.serif, fontSize: 36 }}>{value}</Body>
    </View>
  );
}

/* -------------------- NOK -------------------- */

function NokPanel() {
  const c = useColors();
  const qc = useQueryClient();

  const meQ = useQuery({ queryKey: NOK_ME_KEY, queryFn: () => getNokMe() });
  const emergenciesQ = useQuery({
    queryKey: EMERGENCIES_KEY,
    queryFn: () => listEmergencies(),
    refetchInterval: POLL_MS,
  });

  const linked = meQ.data?.linkedVulnerable;
  const all = emergenciesQ.data?.emergencies ?? [];
  const active = all.find((e) => e.status === "active");
  const past = all.filter((e) => e.status !== "active").slice(0, 5);

  return (
    <View style={{ gap: 18 }}>
      <Section title="Watching over">
        <Card style={{ gap: 8 }}>
          {linked ? (
            <>
              <Body style={{ fontFamily: FONT.serif, fontSize: 22 }}>{linked.name}</Body>
              <Muted>{linked.address}</Muted>
              <Pill
                label={linked.verified ? "Verified resident" : "Pending verification"}
                tone={linked.verified ? "success" : "warn"}
              />
              {linked.lastSeenAt ? (
                <Muted>Last seen: {formatDate(linked.lastSeenAt)}</Muted>
              ) : (
                <Muted>No GPS pings yet</Muted>
              )}
            </>
          ) : (
            <Muted>Loading linked resident…</Muted>
          )}
        </Card>
      </Section>

      {active ? (
        <Section title="Active SOS" subtitle="Your kin has called for help">
          <ResponderStatus emergency={active} />
        </Section>
      ) : (
        <Section title="No active SOS">
          <EmptyState title="All quiet" subtitle="You'll be notified the moment they need help." />
        </Section>
      )}

      {past.length > 0 ? (
        <Section title="Recent SOS history">
          <View style={{ gap: 10 }}>
            {past.map((e) => (
              <EmergencyCard key={e.id} emergency={e} showResponderStats />
            ))}
          </View>
        </Section>
      ) : null}
    </View>
  );
}
