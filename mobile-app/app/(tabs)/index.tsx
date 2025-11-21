import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { supabase } from "@/lib/supabase";
import SessionCard from "@/components/SessionCard";
import { router, useFocusEffect } from "expo-router";

interface BlockingSession {
  id: string;
  mode_name: string;
  websites: string[];
  started_at: string;
  is_active: boolean;
}

export default function HomeScreen() {
  const [session, setSession] = useState<BlockingSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStopping, setIsStopping] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Refresh when screen comes into focus (e.g., when switching back to app)
  useFocusEffect(
    React.useCallback(() => {
      console.log("Screen focused, refreshing session...");
      fetchActiveSession();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    console.log("Manual refresh triggered");
    await fetchActiveSession();
    setRefreshing(false);
  }, []);

  const fetchActiveSession = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (!user || userError) {
        console.log("No authenticated user found, redirecting to login");
        setIsLoading(false);
        // Clear any stale session and redirect
        await supabase.auth.signOut();
        router.replace("/(auth)/login");
        return;
      }

      const { data, error } = await supabase
        .from("blocking_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (error) {
        if (error.code === "PGRST116") {
          // No active session found
          setSession(null);
        } else {
          console.error("Error fetching session:", error);
        }
      } else {
        setSession(data);
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deactivateSession = async (sessionId: string) => {
    setIsStopping(true);
    try {
      const { error } = await (supabase.from("blocking_sessions") as any)
        .update({
          is_active: false,
          stopped_at: new Date().toISOString(),
        })
        .eq("id", sessionId);

      if (error) {
        Alert.alert("Error", "Failed to stop session: " + error.message);
      } else {
        setSession(null);
        Alert.alert("Success", "Session stopped successfully");
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to stop session: " + error.message);
    } finally {
      setIsStopping(false);
    }
  };

  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    const setupRealtimeSubscription = async () => {
      // Get the current user first
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMounted) {
        console.log(
          "No user found or component unmounted, skipping realtime subscription"
        );
        return;
      }

      console.log("Setting up realtime subscription for user:", user.id);

      // First fetch the current session
      await fetchActiveSession();

      // Check if component is still mounted after fetch
      if (!isMounted) {
        console.log("Component unmounted after fetch, skipping subscription");
        return;
      }

      // Set up real-time subscription filtered by user_id
      const channelName = `blocking_sessions_changes_${user.id}`;
      subscription = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "blocking_sessions",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("🔔 Realtime INSERT event received:", {
              payload,
              newRecord: payload.new,
              isActive: payload.new?.is_active,
              userId: payload.new?.user_id,
            });
            // Only refetch if it's an active session
            if (payload.new?.is_active && isMounted) {
              console.log("✅ New active session detected, fetching...");
              fetchActiveSession();
            } else {
              console.log("⚠️ Session is not active, ignoring");
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "blocking_sessions",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("🔔 Realtime UPDATE event received:", {
              old: payload.old,
              new: payload.new,
              eventType: payload.eventType,
              fullPayload: JSON.stringify(payload, null, 2),
            });
            if (!isMounted) {
              console.log("⚠️ Component unmounted, ignoring UPDATE");
              return;
            }

            // Check if session was deactivated
            const wasActive = payload.old?.is_active === true;
            const isNowActive = payload.new?.is_active === true;
            const isNowInactive = payload.new?.is_active === false;

            console.log("Session state change:", {
              wasActive,
              isNowActive,
              isNowInactive,
              oldIsActive: payload.old?.is_active,
              newIsActive: payload.new?.is_active,
            });

            if (isNowInactive && wasActive) {
              console.log(
                "❌ Session deactivated (was active, now inactive), clearing..."
              );
              setSession(null);
            } else if (isNowActive) {
              console.log(
                "✅ Session activated/updated, fetching latest data..."
              );
              // Session was activated or updated, refetch to get latest data
              fetchActiveSession();
            } else {
              console.log(
                "ℹ️ Session update (no active state change), refetching to be safe..."
              );
              // Refetch to ensure we have the latest state
              fetchActiveSession();
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "blocking_sessions",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Realtime DELETE - session removed:", payload.old);
            if (isMounted) {
              setSession(null);
            }
          }
        )
        .subscribe((status, err) => {
          console.log("Realtime subscription status:", status);
          if (err) {
            console.error("❌ Realtime subscription error:", err);
          }
          if (status === "SUBSCRIBED") {
            console.log(
              "✅ Successfully subscribed to blocking session changes for user:",
              user.id
            );
          } else if (status === "CHANNEL_ERROR") {
            console.error("❌ Channel error - subscription failed");
          } else if (status === "TIMED_OUT") {
            console.error("❌ Subscription timed out");
          } else if (status === "CLOSED") {
            console.log("⚠️ Subscription closed");
          }
        });
    };

    setupRealtimeSubscription();

    return () => {
      isMounted = false;
      if (subscription) {
        console.log("Unsubscribing from realtime channel");
        subscription.unsubscribe();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066ff" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </View>
    );
  }

  const isDarkMode = !!session;

  return (
    <ScrollView
      style={[styles.container, isDarkMode && styles.containerDark]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={isDarkMode ? "#fff" : undefined}
        />
      }
    >

      <View style={styles.content}>
        {session ? (
          <SessionCard
            session={session}
            onStop={deactivateSession}
            isLoading={isStopping}
            isDarkMode={isDarkMode}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text
              style={[styles.emptyTitle, isDarkMode && styles.emptyTitleDark]}
            >
              No Active Session
            </Text>
            <Text
              style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}
            >
              Start a blocking session from your browser extension to see it
              here.
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  containerDark: {
    backgroundColor: "#000000",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    paddingTop: 60,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerDark: {
    backgroundColor: "#000000",
    borderBottomColor: "#333333",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
  },
  titleDark: {
    color: "#ffffff",
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  signOutText: {
    color: "#666",
    fontSize: 14,
  },
  signOutTextDark: {
    color: "#9ca3af",
  },
  content: {
    padding: 20,
    paddingTop: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyTitleDark: {
    color: "#ffffff",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  emptyTextDark: {
    color: "#9ca3af",
  },
});
