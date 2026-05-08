import React from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { Screen } from "@/components/Screen";
import { EmptyState, Muted, Section } from "@/components/ui";
import { EmergencyCard } from "@/components/EmergencyCard";
import { useAuth } from "@/hooks/useAuth";
import { listEmergencies } from "@/lib/api";

export default function MyRequestsScreen() {
  const { user } = useAuth();
  const q = useQuery({
    queryKey: ["my-emergencies"],
    queryFn: () => listEmergencies(),
    refetchInterval: 8000,
  });

  if (user?.role !== "vulnerable") {
    return (
      <Screen>
        <Muted>Only residents can view past requests.</Muted>
      </Screen>
    );
  }

  const list = q.data?.emergencies ?? [];

  return (
    <Screen refreshing={q.isFetching} onRefresh={() => q.refetch()}>
      <Section title="Past requests" subtitle="Every SOS you've sent">
        {list.length === 0 ? (
          <EmptyState title="No requests yet" subtitle="When you tap SOS, it will appear here." />
        ) : (
          <View style={{ gap: 12 }}>
            {list.map((e) => (
              <EmergencyCard key={e.id} emergency={e} showResponderStats />
            ))}
          </View>
        )}
      </Section>
    </Screen>
  );
}
