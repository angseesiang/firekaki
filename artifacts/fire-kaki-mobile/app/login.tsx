import React, { useState } from "react";
import { View } from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { Screen } from "@/components/Screen";
import { Body, Button, FONT, Heading, Input, MonoLabel, Muted } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useColors } from "@/hooks/useColors";
import { ApiError } from "@/lib/api";

export default function LoginScreen() {
  const c = useColors();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    if (!email.trim() || !password) {
      setError("Enter your email and password");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      router.replace("/dashboard");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        const data = err.data as { message?: string } | null;
        setError(data?.message ?? "Sign in failed");
      } else {
        setError(err instanceof Error ? err.message : "Sign in failed");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen contentStyle={{ gap: 28, justifyContent: "center" }}>
      <View style={{ gap: 8, alignItems: "flex-start" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="flame" size={26} color={c.primary} />
          <Body style={{ fontFamily: FONT.serif, fontSize: 24, color: c.primary }}>
            Fire Kaki
          </Body>
        </View>
        <Heading>Sign in</Heading>
        <Muted>
          Welcome back. Sign in with the email and password you registered with.
        </Muted>
      </View>

      <View style={{ gap: 14 }}>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="current-password"
          placeholder="••••••••"
        />
        {error ? (
          <Muted style={{ color: c.destructive }}>{error}</Muted>
        ) : null}
        <Button label="Sign in" onPress={onSubmit} loading={busy} />
      </View>

      <View style={{ gap: 8, alignItems: "center" }}>
        <MonoLabel>New here?</MonoLabel>
        <Link href="/signup" asChild>
          <Button label="Create an account" variant="outline" />
        </Link>
      </View>
    </Screen>
  );
}
