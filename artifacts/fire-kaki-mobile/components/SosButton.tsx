import React from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";

import { FONT } from "@/components/ui";
import { useColors } from "@/hooks/useColors";

interface Props {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  state: "ready" | "active" | "no-gps";
  size?: number;
}

export function SosButton({ onPress, loading, disabled, state, size = 240 }: Props) {
  const c = useColors();
  const bg = state === "active" ? c.muted : c.primary;
  const ring = state === "active" ? c.muted : c.primary;
  const fg = state === "active" ? c.foreground : "#fff";
  const isDisabled = disabled || loading || state !== "ready";

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View
        style={{
          position: "absolute",
          width: size + 30,
          height: size + 30,
          borderRadius: (size + 30) / 2,
          borderWidth: 2,
          borderColor: ring,
          opacity: state === "ready" ? 0.25 : 0.1,
        }}
      />
      <Pressable
        onPress={() => {
          if (isDisabled) return;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          onPress();
        }}
        disabled={isDisabled}
        style={({ pressed }) => ({
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.85 : 1,
          shadowColor: c.primary,
          shadowOpacity: 0.35,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 8 },
          elevation: 8,
        })}
      >
        {loading ? (
          <ActivityIndicator color={fg} size="large" />
        ) : (
          <>
            <Ionicons
              name={state === "active" ? "checkmark-circle" : "alert"}
              size={64}
              color={fg}
            />
            <Text
              style={{
                fontFamily: FONT.sansBold,
                color: fg,
                fontSize: 28,
                marginTop: 6,
                letterSpacing: 1.5,
              }}
            >
              {state === "active" ? "HELP IS COMING" : "SOS"}
            </Text>
            <Text
              style={{
                fontFamily: FONT.sans,
                color: fg,
                fontSize: 13,
                marginTop: 4,
                opacity: 0.85,
                textAlign: "center",
                paddingHorizontal: 20,
              }}
            >
              {state === "no-gps"
                ? "Waiting for GPS…"
                : state === "active"
                  ? "Tap when safe"
                  : "Tap to call your kakis"}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
