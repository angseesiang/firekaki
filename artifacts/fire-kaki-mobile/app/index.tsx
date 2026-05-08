import { Redirect } from "expo-router";
import React from "react";
import { ActivityIndicator, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/hooks/useAuth";

export default function Index() {
  const { status } = useAuth();
  const c = useColors();

  if (status === "loading") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: c.background }}>
        <ActivityIndicator color={c.primary} />
      </View>
    );
  }

  if (status === "authenticated") {
    return <Redirect href="/dashboard" />;
  }

  return <Redirect href="/login" />;
}
