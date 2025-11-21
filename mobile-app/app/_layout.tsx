import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { supabase } from "@/lib/supabase";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const systemColorScheme = useColorScheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasActiveSession, setHasActiveSession] = useState(false);

  const checkActiveSession = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("blocking_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("is_active", true)
        .limit(1);

      setHasActiveSession(!error && data && data.length > 0);
    } catch {
      setHasActiveSession(false);
    }
  };

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupChannel = async (userId: string) => {
      // Unsubscribe from existing channel if any
      if (channel) {
        await channel.unsubscribe();
      }

      // Create new channel for this user
      channel = supabase
        .channel(`active_session_check_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "blocking_sessions",
            filter: `user_id=eq.${userId}`,
          },
          async () => {
            // Refetch active session when changes occur
            const {
              data: { user: currentUser },
            } = await supabase.auth.getUser();
            if (currentUser) {
              checkActiveSession(currentUser.id);
            }
          }
        )
        .subscribe();
    };

    // Check initial auth state - use getUser() to validate session with server
    supabase.auth
      .getUser()
      .then(async ({ data: { user }, error: authError }) => {
        if (authError || !user) {
          // If there's an error or no user, clear any stale session
          supabase.auth.signOut().catch(() => {
            // Ignore errors during signout
          });
          setIsAuthenticated(false);
          setHasActiveSession(false);
        } else {
          setIsAuthenticated(true);
          // Check for active session
          await checkActiveSession(user.id);
          // Set up realtime channel
          await setupChannel(user.id);
        }
      });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Validate the session by checking if user exists
      if (session) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
        if (user) {
          await checkActiveSession(user.id);
          await setupChannel(user.id);
        }
      } else {
        setIsAuthenticated(false);
        setHasActiveSession(false);
        if (channel) {
          await channel.unsubscribe();
          channel = null;
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, []);

  // Use dark mode when there's an active session, otherwise use system preference
  const colorScheme = hasActiveSession ? "dark" : systemColorScheme;

  // Show nothing while checking auth
  if (isAuthenticated === null) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
                title: "",
              }}
            />
            <Stack.Screen
              name="modal"
              options={{ presentation: "modal", title: "Modal" }}
            />
          </>
        ) : (
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        )}
      </Stack>
      <StatusBar style={hasActiveSession ? "light" : "auto"} />
    </ThemeProvider>
  );
}
