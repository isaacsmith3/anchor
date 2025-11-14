import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { supabase } from "@/lib/supabase";
import SessionCard from "@/components/SessionCard";
import { router } from "expo-router";

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

  const fetchActiveSession = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/(auth)/login");
  };

  useEffect(() => {
    fetchActiveSession();

    // Set up real-time subscription
    const subscription = supabase
      .channel("blocking_sessions_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "blocking_sessions",
        },
        () => {
          // Refetch when changes occur
          fetchActiveSession();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚓ Anchor Blocker</Text>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {session ? (
          <SessionCard
            session={session}
            onStop={deactivateSession}
            isLoading={isStopping}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>No Active Session</Text>
            <Text style={styles.emptyText}>
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
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
  },
  signOutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  signOutText: {
    color: "#666",
    fontSize: 14,
  },
  content: {
    padding: 20,
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
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});
