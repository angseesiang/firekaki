import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { Body, Card, Muted, Pill } from "@/components/ui";
import { useColors } from "@/hooks/useColors";
import type { Emergency } from "@/lib/api";
import { formatDistance, formatEta, timeAgo } from "@/lib/format";

export function ResponderStatus({ emergency }: { emergency: Emergency }) {
  const c = useColors();
  const stats = emergency.responseStats;
  const responders = emergency.responders ?? [];
  const accepted = stats?.accepted ?? 0;
  const arrived = stats?.arrived ?? 0;

  return (
    <Card style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: c.primary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="people" size={18} color="#fff" />
          </View>
          <View>
            <Body style={{ fontWeight: "600" }}>
              {accepted} {accepted === 1 ? "neighbour" : "neighbours"} on the way
            </Body>
            {arrived > 0 ? (
              <Muted>{arrived} arrived</Muted>
            ) : (
              <Muted>Standby — they will be with you shortly</Muted>
            )}
          </View>
        </View>
      </View>

      {responders.length === 0 ? null : (
        <View style={{ gap: 10 }}>
          {responders.map((r) => (
            <View
              key={r.volunteerId}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: c.border,
              }}
            >
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Body style={{ fontWeight: "600" }}>{r.name}</Body>
                <Muted>
                  {formatDistance(r.distanceM)} · responded {timeAgo(r.respondedAt)}
                </Muted>
              </View>
              {r.arrivedAt ? (
                <Pill label="Arrived" tone="success" />
              ) : (
                <Pill label={`ETA ${formatEta(r.etaSeconds)}`} tone="primary" />
              )}
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}
