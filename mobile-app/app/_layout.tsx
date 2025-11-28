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

// Custom themes matching the Anchor design system
const AnchorLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#0f0f0f",
    background: "#ffffff",
    card: "#ffffff",
    text: "#0f0f0f",
    border: "#e5e5e5",
    notification: "#0f0f0f",
  },
};

const AnchorDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#ffffff",
    background: "#0f0f0f",
    card: "#0f0f0f",
    text: "#ffffff",
    border: "#262626",
    notification: "#ffffff",
  },
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
      if (channel) {
        await channel.unsubscribe();
      }

      channel = supabase
        .channel(`active_session_check_${userId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "blocking_sessions",
            filter: `user_id=eq.${userId}`,
          },
          async () => {
            const {
              data: { user: currentUser },
            } = await supabase.auth.getUser();
            if (currentUser) {
              await checkActiveSession(currentUser.id);
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "blocking_sessions",
            filter: `user_id=eq.${userId}`,
          },
          async () => {
            const {
              data: { user: currentUser },
            } = await supabase.auth.getUser();
            if (currentUser) {
              await checkActiveSession(currentUser.id);
            }
          }
        )
        .subscribe();
    };

    supabase.auth
      .getUser()
      .then(async ({ data: { user }, error: authError }) => {
        if (authError || !user) {
          supabase.auth.signOut().catch(() => {});
          setIsAuthenticated(false);
          setHasActiveSession(false);
        } else {
          setIsAuthenticated(true);
          await checkActiveSession(user.id);
          await setupChannel(user.id);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
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
    <ThemeProvider
      value={colorScheme === "dark" ? AnchorDarkTheme : AnchorLightTheme}
    >
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
