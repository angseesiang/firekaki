import React, { useMemo, useState } from "react";
import { Alert, Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Screen } from "@/components/Screen";
import {
  Body,
  Button,
  Card,
  EmptyState,
  FONT,
  Input,
  MonoLabel,
  Muted,
  Pill,
  Section,
} from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import {
  adminCreateUser,
  adminDeleteUser,
  adminDisableUser,
  adminEnableUser,
  adminListAllUsers,
  reviewerListUsers,
  verifyVolunteer,
  verifyVulnerable,
  type AdminListVolunteer,
  type AdminListVulnerable,
} from "@/lib/api";

type Tab = "volunteers" | "vulnerable" | "staff";

export default function ManageScreen() {
  const { user } = useAuth();
  const c = useColors();
  const isAdmin = user?.role === "admin";
  const isReviewer = user?.role === "reviewer";

  const [tab, setTab] = useState<Tab>("volunteers");

  if (!isAdmin && !isReviewer) {
    return (
      <Screen>
        <Muted>Only reviewers or admins can manage users.</Muted>
      </Screen>
    );
  }

  const tabs: Tab[] = isAdmin
    ? ["volunteers", "vulnerable", "staff"]
    : ["volunteers", "vulnerable"];

  return (
    <Screen>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {tabs.map((t) => {
          const active = tab === t;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: c.radius,
                backgroundColor: active ? c.primary : c.muted,
                alignItems: "center",
              }}
            >
              <Body style={{ color: active ? "#fff" : c.foreground, fontWeight: "600" }}>
                {t === "volunteers" ? "Kakis" : t === "vulnerable" ? "Residents" : "Staff"}
              </Body>
            </Pressable>
          );
        })}
      </View>

      {tab === "volunteers" || tab === "vulnerable" ? (
        <UsersList kind={tab} isAdmin={isAdmin} />
      ) : null}
      {tab === "staff" && isAdmin ? <StaffPanel /> : null}
    </Screen>
  );
}

function UsersList({ kind, isAdmin }: { kind: "volunteers" | "vulnerable"; isAdmin: boolean }) {
  const qc = useQueryClient();
  const c = useColors();

  const overviewQ = useQuery({
    queryKey: ["users-overview", isAdmin],
    queryFn: () => (isAdmin ? adminListAllUsers() : reviewerListUsers()),
  });

  const verifyVol = useMutation({
    mutationFn: (id: number) => verifyVolunteer(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users-overview", isAdmin] }),
  });
  const verifyVuln = useMutation({
    mutationFn: (id: number) => verifyVulnerable(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users-overview", isAdmin] }),
  });
  const disable = useMutation({
    mutationFn: ({ role, id }: { role: "volunteer" | "vulnerable"; id: number }) =>
      adminDisableUser(role, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users-overview", isAdmin] }),
  });
  const enable = useMutation({
    mutationFn: ({ role, id }: { role: "volunteer" | "vulnerable"; id: number }) =>
      adminEnableUser(role, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users-overview", isAdmin] }),
  });
  const remove = useMutation({
    mutationFn: ({ role, id }: { role: "volunteer" | "vulnerable"; id: number }) =>
      adminDeleteUser(role, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users-overview", isAdmin] }),
  });

  const data = overviewQ.data;
  const list: (AdminListVolunteer | AdminListVulnerable)[] = useMemo(() => {
    if (!data) return [];
    return kind === "volunteers" ? data.volunteers : data.vulnerables;
  }, [data, kind]);

  return (
    <Section title={kind === "volunteers" ? "Kakis" : "Residents"}>
      {overviewQ.isLoading ? (
        <Muted>Loading…</Muted>
      ) : list.length === 0 ? (
        <EmptyState title="No accounts yet" />
      ) : (
        <View style={{ gap: 10 }}>
          {list.map((u) => {
            const isVol = kind === "volunteers";
            const role = isVol ? "volunteer" : "vulnerable";
            return (
              <Card key={`${role}-${u.id}`} style={{ gap: 8 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Body style={{ fontWeight: "700" }}>{u.name}</Body>
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {u.disabled ? <Pill label="Disabled" tone="danger" /> : null}
                    {(u as AdminListVulnerable).verified === false || (u as AdminListVolunteer).verified === false ? (
                      <Pill label="Pending" tone="warn" />
                    ) : (
                      <Pill label="Verified" tone="success" />
                    )}
                  </View>
                </View>
                <Muted>{u.email}</Muted>
                {!isVol ? <Muted>{(u as AdminListVulnerable).address}</Muted> : null}
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 }}>
                  {!u.disabled && !(u as { verified: boolean }).verified ? (
                    <View style={{ flexGrow: 1, minWidth: 140 }}>
                      <Button
                        label="Verify"
                        loading={
                          isVol
                            ? verifyVol.isPending && verifyVol.variables === u.id
                            : verifyVuln.isPending && verifyVuln.variables === u.id
                        }
                        onPress={() => (isVol ? verifyVol.mutate(u.id) : verifyVuln.mutate(u.id))}
                      />
                    </View>
                  ) : null}
                  {isAdmin ? (
                    u.disabled ? (
                      <View style={{ flexGrow: 1, minWidth: 140 }}>
                        <Button
                          label="Enable"
                          variant="secondary"
                          onPress={() => enable.mutate({ role, id: u.id })}
                        />
                      </View>
                    ) : (
                      <View style={{ flexGrow: 1, minWidth: 140 }}>
                        <Button
                          label="Disable"
                          variant="outline"
                          onPress={() => disable.mutate({ role, id: u.id })}
                        />
                      </View>
                    )
                  ) : null}
                  {isAdmin ? (
                    <View style={{ flexGrow: 1, minWidth: 140 }}>
                      <Button
                        label="Delete"
                        variant="destructive"
                        onPress={() =>
                          Alert.alert("Delete account?", `Permanently remove ${u.name}.`, [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: () => remove.mutate({ role, id: u.id }),
                            },
                          ])
                        }
                      />
                    </View>
                  ) : null}
                </View>
              </Card>
            );
          })}
        </View>
      )}
    </Section>
  );
}

function StaffPanel() {
  const qc = useQueryClient();
  const c = useColors();
  const overviewQ = useQuery({
    queryKey: ["users-overview", true],
    queryFn: () => adminListAllUsers(),
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"reviewer" | "admin">("reviewer");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: () =>
      adminCreateUser({ name: name.trim(), email: email.trim().toLowerCase(), password, role }),
    onSuccess: () => {
      setName("");
      setEmail("");
      setPassword("");
      qc.invalidateQueries({ queryKey: ["users-overview", true] });
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Failed to create staff");
    },
  });

  const data = overviewQ.data;
  const admins = data?.admins ?? [];
  const reviewers = data?.reviewers ?? [];

  return (
    <View style={{ gap: 18 }}>
      <Section title="Add staff" subtitle="Create reviewer or admin accounts">
        <Card style={{ gap: 12 }}>
          <Input label="Name" value={name} onChangeText={setName} />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="At least 8 characters"
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["reviewer", "admin"] as const).map((r) => (
              <Pressable
                key={r}
                onPress={() => setRole(r)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: c.radius,
                  backgroundColor: role === r ? c.primary : c.muted,
                  alignItems: "center",
                }}
              >
                <Body style={{ color: role === r ? "#fff" : c.foreground, fontWeight: "600" }}>
                  {r === "reviewer" ? "Reviewer" : "Admin"}
                </Body>
              </Pressable>
            ))}
          </View>
          {error ? <Muted style={{ color: c.destructive }}>{error}</Muted> : null}
          <Button
            label="Create staff account"
            loading={create.isPending}
            disabled={!name.trim() || !email.trim() || password.length < 8}
            onPress={() => {
              setError(null);
              create.mutate();
            }}
          />
        </Card>
      </Section>

      <Section title="Admins">
        {admins.length === 0 ? (
          <Muted>No admins.</Muted>
        ) : (
          <View style={{ gap: 8 }}>
            {admins.map((a) => (
              <Card key={`admin-${a.id}`} style={{ gap: 4 }}>
                <Body style={{ fontWeight: "700" }}>{a.name}</Body>
                <Muted>{a.email}</Muted>
              </Card>
            ))}
          </View>
        )}
      </Section>

      <Section title="Reviewers">
        {reviewers.length === 0 ? (
          <Muted>No reviewers yet.</Muted>
        ) : (
          <View style={{ gap: 8 }}>
            {reviewers.map((a) => (
              <Card key={`rev-${a.id}`} style={{ gap: 4 }}>
                <Body style={{ fontWeight: "700" }}>{a.name}</Body>
                <Muted>{a.email}</Muted>
                {a.disabled ? <Pill label="Disabled" tone="danger" /> : null}
              </Card>
            ))}
          </View>
        )}
      </Section>
    </View>
  );
}
