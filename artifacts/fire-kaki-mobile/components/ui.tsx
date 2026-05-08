import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  StyleProp,
  TextStyle,
} from "react-native";
import * as Haptics from "expo-haptics";

import { useColors } from "@/hooks/useColors";

export const FONT = {
  serif: "InstrumentSerif_400Regular",
  sans: "PlusJakartaSans_400Regular",
  sansMedium: "PlusJakartaSans_500Medium",
  sansSemibold: "PlusJakartaSans_600SemiBold",
  sansBold: "PlusJakartaSans_700Bold",
};

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  loading,
  disabled,
  style,
  haptic = true,
  testID,
}: ButtonProps) {
  const c = useColors();
  const bg =
    variant === "primary"
      ? c.primary
      : variant === "secondary"
        ? c.secondary
        : variant === "destructive"
          ? c.destructive
          : "transparent";
  const fg =
    variant === "outline" || variant === "ghost"
      ? c.foreground
      : variant === "secondary"
        ? c.secondaryForeground
        : "#fff";
  const border =
    variant === "outline" ? c.border : "transparent";
  const isDisabled = disabled || loading;

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        if (isDisabled) return;
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderColor: border,
          borderWidth: variant === "outline" ? 1 : 0,
          borderRadius: c.radius,
          paddingVertical: 14,
          paddingHorizontal: 18,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={fg} /> : null}
      <Text
        style={{
          color: fg,
          fontFamily: FONT.sansSemibold,
          fontSize: 15,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

interface InputProps extends TextInputProps {
  label?: string;
  error?: string | null;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Input({ label, error, containerStyle, style, ...rest }: InputProps) {
  const c = useColors();
  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label ? (
        <Text
          style={{
            fontFamily: FONT.sansMedium,
            fontSize: 13,
            color: c.mutedForeground,
            letterSpacing: 0.3,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>
      ) : null}
      <TextInput
        placeholderTextColor={c.mutedForeground}
        style={[
          {
            backgroundColor: c.card,
            borderColor: error ? c.destructive : c.border,
            borderWidth: 1,
            borderRadius: c.radius,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 16,
            color: c.foreground,
            fontFamily: FONT.sans,
          },
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text style={{ color: c.destructive, fontFamily: FONT.sans, fontSize: 13 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  tone?: "default" | "primary" | "muted";
}

export function Card({ children, style, tone = "default" }: CardProps) {
  const c = useColors();
  const bg =
    tone === "primary" ? c.primary : tone === "muted" ? c.muted : c.card;
  const border =
    tone === "primary" ? c.primary : tone === "muted" ? c.border : c.border;
  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderRadius: c.radius + 4,
          borderWidth: 1,
          borderColor: border,
          padding: 18,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Pill({
  label,
  tone = "muted",
  style,
}: {
  label: string;
  tone?: "muted" | "primary" | "success" | "warn" | "danger" | "accent";
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const palette: Record<string, { bg: string; fg: string }> = {
    muted: { bg: c.muted, fg: c.mutedForeground },
    primary: { bg: c.primary, fg: "#fff" },
    success: { bg: "#dcfce7", fg: "#166534" },
    warn: { bg: "#fef3c7", fg: "#854d0e" },
    danger: { bg: "#fee2e2", fg: "#991b1b" },
    accent: { bg: c.accent, fg: c.accentForeground },
  };
  const p = palette[tone];
  return (
    <View
      style={[
        {
          backgroundColor: p.bg,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: 999,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      <Text
        style={{
          color: p.fg,
          fontFamily: FONT.sansSemibold,
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.6,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

export function Section({
  title,
  subtitle,
  right,
  children,
  style,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  return (
    <View style={[{ gap: 12 }, style]}>
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: FONT.serif, fontSize: 24, color: c.foreground }}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                fontFamily: FONT.sans,
                fontSize: 14,
                color: c.mutedForeground,
                marginTop: 2,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

export function MonoLabel({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  const c = useColors();
  return (
    <Text
      style={[
        {
          fontFamily: FONT.sansSemibold,
          fontSize: 11,
          color: c.primary,
          textTransform: "uppercase",
          letterSpacing: 1,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

type TextLikeProps = {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export function Body({ children, style, numberOfLines }: TextLikeProps) {
  const c = useColors();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: FONT.sans, fontSize: 15, color: c.foreground }, style]}
    >
      {children}
    </Text>
  );
}

export function Muted({ children, style, numberOfLines }: TextLikeProps) {
  const c = useColors();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: FONT.sans, fontSize: 14, color: c.mutedForeground }, style]}
    >
      {children}
    </Text>
  );
}

export function Heading({ children, style, numberOfLines }: TextLikeProps) {
  const c = useColors();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[{ fontFamily: FONT.serif, fontSize: 32, color: c.foreground }, style]}
    >
      {children}
    </Text>
  );
}

export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const c = useColors();
  return (
    <View
      style={{
        padding: 32,
        alignItems: "center",
        gap: 6,
      }}
    >
      <Text style={{ fontFamily: FONT.serif, fontSize: 20, color: c.foreground }}>{title}</Text>
      {subtitle ? <Muted style={{ textAlign: "center" }}>{subtitle}</Muted> : null}
    </View>
  );
}

export const styles = StyleSheet.create({});
