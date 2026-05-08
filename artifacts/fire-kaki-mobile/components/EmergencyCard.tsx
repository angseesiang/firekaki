import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Body, Button, Card, Muted, Pill } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import type { Emergency } from "@/lib/api";
import { formatDistance, timeAgo } from "@/lib/format";

interface Props {
  emergency: Emergency;
  showResponderStats?: boolean;
  primaryAction?: {
    label: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "outline" | "destructive";
    loading?: boolean;
    disabled?: boolean;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
    variant?: "primary" | "secondary" | "outline" | "destructive";
    loading?: boolean;
    disabled?: boolean;
  };
  footer?: React.ReactNode;
}

export function EmergencyCard({
  emergency,
  showResponderStats,
  primaryAction,
  secondaryAction,
  footer,
}: Props) {
  const c = useColors();
  const e = emergency;
  const isMajor = e.type === "major";
  const statusTone =
    e.status === "active" ? "danger" : e.status === "resolved" ? "success" : "muted";

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
            <Ionicons
              name={isMajor ? "warning" : "alert-circle"}
              size={18}
              color={isMajor ? c.primary : c.secondary}
            />
            <Body style={{ fontWeight: "700" }}>
              {isMajor ? "Major emergency" : "Minor SOS"}
            </Body>
          </View>
          <Muted>by {e.creatorName}</Muted>
        </View>
        <Pill label={e.status} tone={statusTone as never} />
      </View>

      <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
        <Ionicons name="location" size={14} color={c.mutedForeground} />
        <Muted style={{ flex: 1 }} numberOfLines={1}>
          {e.address ??
            (e.lat != null && e.lng != null
              ? `${e.lat.toFixed(4)}, ${e.lng.toFixed(4)}`
              : "Location not shared")}
        </Muted>
      </View>

      <View style={{ flexDirection: "row", gap: 12 }}>
        <Muted>{timeAgo(e.createdAt)}</Muted>
        {e.distanceM != null ? <Muted>· {formatDistance(e.distanceM)} away</Muted> : null}
      </View>

      {showResponderStats && e.responseStats ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pill label={`${e.responseStats.accepted} accepted`} tone="primary" />
          {e.responseStats.arrived > 0 ? (
            <Pill label={`${e.responseStats.arrived} arrived`} tone="success" />
          ) : null}
          {e.responseStats.declined > 0 ? (
            <Pill label={`${e.responseStats.declined} declined`} tone="muted" />
          ) : null}
        </View>
      ) : null}

      {footer}

      {primaryAction || secondaryAction ? (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
          {secondaryAction ? (
            <View style={{ flex: 1 }}>
              <Button
                label={secondaryAction.label}
                onPress={secondaryAction.onPress}
                variant={secondaryAction.variant ?? "outline"}
                loading={secondaryAction.loading}
                disabled={secondaryAction.disabled}
              />
            </View>
          ) : null}
          {primaryAction ? (
            <View style={{ flex: 1 }}>
              <Button
                label={primaryAction.label}
                onPress={primaryAction.onPress}
                variant={primaryAction.variant ?? "primary"}
                loading={primaryAction.loading}
                disabled={primaryAction.disabled}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </Card>
  );
}
