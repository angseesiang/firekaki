import React, { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/Screen";
import { Body, Button, Card, FONT, Heading, Input, MonoLabel, Muted } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { ApiError, type SignupRequest } from "@/lib/api";

type RoleKey = "volunteer" | "vulnerable";

interface RoleOption {
  key: RoleKey;
  title: string;
  description: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
}

const ROLES: RoleOption[] = [
  {
    key: "vulnerable",
    title: "I'm a resident",
    description: "Get help fast — tap SOS to alert nearby kakis.",
    icon: "home",
  },
  {
    key: "volunteer",
    title: "I'm a kaki",
    description: "Be a first responder for neighbours nearby.",
    icon: "people",
  },
];

export default function SignupScreen() {
  const c = useColors();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [nokName, setNokName] = useState("");
  const [nokContact, setNokContact] = useState("");
  const [nokOptIn, setNokOptIn] = useState(false);
  const [nokEmail, setNokEmail] = useState("");
  const [nokPassword, setNokPassword] = useState("");
  const [selected, setSelected] = useState<Set<RoleKey>>(new Set(["vulnerable"]));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isVulnerable = selected.has("vulnerable");
  const isVolunteer = selected.has("volunteer");

  const valid = useMemo(() => {
    if (!name.trim() || !email.trim() || password.length < 8) return false;
    if (selected.size === 0) return false;
    if (isVulnerable && !address.trim()) return false;
    if (nokOptIn && (!nokName.trim() || !nokContact.trim() || !nokEmail.trim() || nokPassword.length < 8)) return false;
    return true;
  }, [name, email, password, selected.size, isVulnerable, address, nokOptIn, nokName, nokContact, nokEmail, nokPassword]);

  function toggleRole(role: RoleKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  async function onSubmit() {
    setError(null);
    if (!valid) {
      setError("Fill in all required fields. Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const body: SignupRequest = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        roles: Array.from(selected),
        ...(isVolunteer ? { volunteer: { gpsConsent: true } } : {}),
        ...(isVulnerable
          ? {
              vulnerable: {
                address: address.trim(),
                nokName: nokName.trim(),
                nokRelation: "",
                nokContact: nokContact.trim(),
              },
            }
          : {}),
        ...(isVulnerable && nokOptIn
          ? {
              nokAccount: {
                email: nokEmail.trim().toLowerCase(),
                password: nokPassword,
              },
            }
          : {}),
      };
      await signup(body);
      router.replace("/dashboard");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const data = err.data as { message?: string } | null;
        setError(data?.message ?? "Signup failed");
      } else {
        setError(err instanceof Error ? err.message : "Signup failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen contentStyle={{ gap: 22 }}>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="flame" size={22} color={c.primary} />
          <Body style={{ fontFamily: FONT.serif, fontSize: 22, color: c.primary }}>
            Fire Kaki
          </Body>
        </View>
        <Heading>Join the network</Heading>
        <Muted>
          You can sign up as a resident who needs help, a kaki who responds, or both.
        </Muted>
      </View>

      <View style={{ gap: 10 }}>
        <MonoLabel>Choose your role(s)</MonoLabel>
        {ROLES.map((r) => {
          const active = selected.has(r.key);
          return (
            <Pressable key={r.key} onPress={() => toggleRole(r.key)}>
              <Card
                style={{
                  borderColor: active ? c.primary : c.border,
                  borderWidth: active ? 2 : 1,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: active ? c.primary : c.muted,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons name={r.icon} size={18} color={active ? "#fff" : c.foreground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: "700" }}>{r.title}</Body>
                  <Muted>{r.description}</Muted>
                </View>
                <Ionicons
                  name={active ? "checkmark-circle" : "ellipse-outline"}
                  size={22}
                  color={active ? c.primary : c.mutedForeground}
                />
              </Card>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 12 }}>
        <Input label="Full name" value={name} onChangeText={setName} placeholder="e.g. Mei Lin Tan" />
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="At least 8 characters"
        />
        <Input
          label="Phone (optional)"
          value={contact}
          onChangeText={setContact}
          keyboardType="phone-pad"
          placeholder="+65 …"
        />
      </View>

      {isVulnerable ? (
        <View style={{ gap: 12 }}>
          <MonoLabel>Resident details</MonoLabel>
          <Input
            label="Home address"
            value={address}
            onChangeText={setAddress}
            placeholder="Block, street, unit"
          />
          <Input
            label="Next-of-kin name"
            value={nokName}
            onChangeText={setNokName}
            placeholder="Optional"
          />
          <Input
            label="Next-of-kin phone"
            value={nokContact}
            onChangeText={setNokContact}
            keyboardType="phone-pad"
            placeholder="Optional"
          />

          <Pressable onPress={() => setNokOptIn((v) => !v)}>
            <Card
              tone="muted"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                borderColor: nokOptIn ? c.primary : c.border,
                borderWidth: nokOptIn ? 2 : 1,
              }}
            >
              <Ionicons
                name={nokOptIn ? "checkbox" : "square-outline"}
                size={22}
                color={nokOptIn ? c.primary : c.mutedForeground}
              />
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: "600" }}>Create a Next-of-kin login</Body>
                <Muted>
                  Let your next-of-kin sign in to watch over your SOS feed.
                </Muted>
              </View>
            </Card>
          </Pressable>

          {nokOptIn ? (
            <View style={{ gap: 12 }}>
              <Input
                label="NOK email"
                value={nokEmail}
                onChangeText={setNokEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="kin@example.com"
              />
              <Input
                label="NOK password"
                value={nokPassword}
                onChangeText={setNokPassword}
                secureTextEntry
                placeholder="At least 8 characters"
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {error ? <Muted style={{ color: c.destructive }}>{error}</Muted> : null}

      <Button label="Create account" onPress={onSubmit} loading={busy} disabled={!valid} />

      <View style={{ alignItems: "center", gap: 6 }}>
        <Muted>Already have an account?</Muted>
        <Link href="/login" asChild>
          <Pressable>
            <Body style={{ color: c.primary, fontWeight: "600" }}>Sign in</Body>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}
