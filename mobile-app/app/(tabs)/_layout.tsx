import { Tabs } from "expo-router";
import React, { useState, useEffect } from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import Feather from "@expo/vector-icons/Feather";
import { supabase } from "@/lib/supabase";

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
          console.log("Tab bar - Active session check:", hasSession);
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

      // Listen for session changes filtered by user_id
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
          (payload) => {
            console.log("Tab bar - Session UPDATE received:", {
              old: payload.old,
              new: payload.new,
            });
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
            console.log("Tab bar - Session INSERT received");
            if (isMounted) {
              checkActiveSession();
            }
          }
        )
        .subscribe((status) => {
          console.log("Tab bar subscription status:", status);
        });
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

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: colorScheme === "dark" ? "#666" : undefined,
        tabBarStyle: {
          backgroundColor: colorScheme === "dark" ? "#000000" : "#ffffff",
          borderTopColor: colorScheme === "dark" ? "#333333" : "#e0e0e0",
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Anchor",
          tabBarLabel: "Anchor",
          tabBarIcon: ({ color }) => (
            <Feather name="anchor" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarLabel: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
