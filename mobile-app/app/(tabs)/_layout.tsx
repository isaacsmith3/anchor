import { Tabs } from "expo-router";
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";

function CustomTabBar({
  state,
  descriptors,
  navigation,
  colors,
}: BottomTabBarProps & { colors: (typeof Colors)["light"] }) {
  return (
    <View style={[styles.tabBar, { backgroundColor: colors.background }]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const rawLabel = options.tabBarLabel ?? options.title ?? route.name;
        const label =
          typeof rawLabel === "function" ? route.name : String(rawLabel);
        const isFocused = state.index === index;

        const onPress = () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Text
              style={[
                styles.tabLabel,
                {
                  color: isFocused ? colors.text : colors.textMuted,
                  fontWeight: isFocused ? "700" : "500",
                },
              ]}
            >
              {label.toUpperCase()}
            </Text>
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: isFocused ? colors.text : "transparent",
                },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const systemColorScheme = useColorScheme();
  const [hasActiveSession, setHasActiveSession] = useState(false);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    const checkActiveSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || !isMounted) return;

        const { data, error } = await supabase
          .from("blocking_sessions")
          .select("id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .limit(1);

        if (isMounted) {
          const hasSession = !error && data && data.length > 0;
          setHasActiveSession(hasSession);
        }
      } catch {
        if (isMounted) {
          setHasActiveSession(false);
        }
      }
    };

    const setupSubscription = async () => {
      await checkActiveSession();

      if (!isMounted) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !isMounted) return;

      channel = supabase
        .channel(`tab_bar_session_check_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "blocking_sessions",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            if (isMounted) {
              checkActiveSession();
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "blocking_sessions",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            if (isMounted) {
              checkActiveSession();
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      isMounted = false;
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  // Use dark mode when there's an active session, otherwise use system preference
  const colorScheme = hasActiveSession ? "dark" : systemColorScheme;
  const colors = Colors[colorScheme ?? "light"];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} colors={colors} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Anchor",
          tabBarLabel: "Anchor",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 48,
  },
  tabItem: {
    alignItems: "center",
    gap: 8,
  },
  tabLabel: {
    fontSize: 12,
    letterSpacing: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
