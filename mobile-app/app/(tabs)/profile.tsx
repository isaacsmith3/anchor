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
import { Colors } from "@/constants/theme";

export default function ProfileScreen() {
  const [hasActiveSession, setHasActiveSession] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    const checkActiveSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || !isMounted) return;

        setUserEmail(user.email || null);

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

  const isDarkMode = hasActiveSession;
  const colors = isDarkMode ? Colors.dark : Colors.light;

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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.logo, { color: colors.text }]}>ANCHOR</Text>
      </View>

      <View style={styles.content}>
        {/* Profile Section */}
        <View style={styles.section}>
          {userEmail && (
            <Text style={[styles.email, { color: colors.textMuted }]}>
              {userEmail}
            </Text>
          )}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[
            styles.signOutButton,
            {
              borderColor: colors.text,
            },
          ]}
          onPress={handleSignOut}
        >
          <Text style={[styles.signOutButtonText, { color: colors.text }]}>
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
  },
  header: {
    paddingTop: 70,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  logo: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 2,
  },
  content: {
    padding: 24,
    paddingTop: 40,
  },
  section: {
    marginBottom: 40,
    marginTop: 40,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginBottom: 8,
  },
  email: {
    fontSize: 15,
  },
  signOutButton: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    alignSelf: "center",
    width: "50%",
  },
  signOutButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
