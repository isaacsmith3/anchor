import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";

export default function ProfileScreen() {
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
          setHasActiveSession(!error && data && data.length > 0);
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
        .channel(`profile_session_check_${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "blocking_sessions",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            console.log("Profile - Session UPDATE received:", {
              old: payload.old,
              new: payload.new,
              isActive: payload.new?.is_active,
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
          (payload) => {
            console.log("Profile - Session INSERT received:", {
              isActive: payload.new?.is_active,
            });
            if (isMounted) {
              checkActiveSession();
            }
          }
        )
        .subscribe((status) => {
          console.log("Profile subscription status:", status);
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

  const isDarkMode = hasActiveSession;

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await supabase.auth.signOut();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={[styles.content, isDarkMode && styles.contentDark]}>
        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}
          >
            Profile
          </Text>
          <Text
            style={[
              styles.sectionDescription,
              isDarkMode && styles.sectionDescriptionDark,
            ]}
          >
            Manage your account settings
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.signOutButton, isDarkMode && styles.signOutButtonDark]}
          onPress={handleSignOut}
        >
          <Text
            style={[
              styles.signOutButtonText,
              isDarkMode && styles.signOutButtonTextDark,
            ]}
          >
            Sign Out
          </Text>
        </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
  },
  content: {
    padding: 20,
    paddingTop: 100,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: "#666",
  },
  signOutButton: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  signOutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  containerDark: {
    backgroundColor: "#000000",
  },
  contentDark: {
    backgroundColor: "#000000",
  },
  sectionTitleDark: {
    color: "#ffffff",
  },
  sectionDescriptionDark: {
    color: "#9ca3af",
  },
  signOutButtonDark: {
    backgroundColor: "#ef4444",
  },
  signOutButtonTextDark: {
    color: "#ffffff",
  },
});
