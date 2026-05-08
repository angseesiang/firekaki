import React from "react";
import { Platform, ScrollView, StatusBar, View, ViewStyle, StyleProp, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  noTopPadding?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export function Screen({
  children,
  scroll = true,
  style,
  contentStyle,
  noTopPadding,
  refreshing,
  onRefresh,
}: Props) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const topPad = noTopPadding ? 0 : Math.max(insets.top, Platform.OS === "web" ? 24 : 0);
  const bottomPad = Math.max(insets.bottom, Platform.OS === "web" ? 34 : 16);

  const inner = (
    <View
      style={[
        {
          paddingTop: topPad + 8,
          paddingBottom: bottomPad + 16,
          paddingHorizontal: 20,
          gap: 18,
          flexGrow: 1,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={[{ flex: 1, backgroundColor: c.background }, style]}>
      <StatusBar barStyle="dark-content" backgroundColor={c.background} />
      {scroll ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.primary} />
            ) : undefined
          }
        >
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </View>
  );
}
