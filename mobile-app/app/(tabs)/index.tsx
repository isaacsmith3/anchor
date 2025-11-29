import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Image,
  Platform,
} from "react-native";
import { supabase } from "@/lib/supabase";
import SessionCard from "@/components/SessionCard";
import { router, useFocusEffect } from "expo-router";
import { Colors } from "@/constants/theme";
import NfcManager, { NfcTech } from "react-native-nfc-manager";

// TODO: get rid of any imports

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
  const [isNfcSupported, setIsNfcSupported] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const isDarkMode = !!session;
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // Initialize NFC on mount
  useEffect(() => {
    const initNfc = async () => {
      try {
        const supported = await NfcManager.isSupported();
        setIsNfcSupported(supported);
        if (supported) {
          await NfcManager.start();
        }
      } catch (error) {
        console.warn("NFC initialization error:", error);
        setIsNfcSupported(false);
      }
    };
    initNfc();

    return () => {
      NfcManager.cancelTechnologyRequest().catch(() => {});
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchActiveSession();
    }, [])
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
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
        setIsLoading(false);
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

  // Verify NFC tap before allowing session deactivation
  const verifyNfcTap = async (): Promise<boolean> => {
    // Skip NFC on web or unsupported devices
    if (Platform.OS === "web" || !isNfcSupported) {
      return true;
    }

    try {
      setIsScanning(true);

      // Request NFC technology - this will prompt the user to tap
      await NfcManager.requestTechnology(NfcTech.Ndef);

      // Read the tag to verify tap occurred
      const tag = await NfcManager.getTag();

      if (tag?.id) {
        // Successfully read an NFC tag
        // You could extend this to verify against a registered tag ID
        return true;
      }

      return false;
    } catch (error: any) {
      // User cancelled or timeout
      if (error.message?.includes("cancelled")) {
        return false;
      }
      console.warn("NFC error:", error);
      return false;
    } finally {
      setIsScanning(false);
      NfcManager.cancelTechnologyRequest().catch(() => {});
    }
  };

  const deactivateSession = async (sessionId: string) => {
    // First, require NFC tap verification
    if (isNfcSupported && Platform.OS !== "web") {
      Alert.alert(
        "Tap to Unlock",
        "Hold your phone near your Anchor device to stop the session",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Ready to Tap",
            onPress: async () => {
              const verified = await verifyNfcTap();
              if (verified) {
                await performDeactivation(sessionId);
              } else {
                Alert.alert(
                  "NFC Required",
                  "Please tap your Anchor device to stop the session"
                );
              }
            },
          },
        ]
      );
      return;
    }

    // Fallback for devices without NFC
    await performDeactivation(sessionId);
  };

  const performDeactivation = async (sessionId: string) => {
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMounted) return;

      await fetchActiveSession();

      if (!isMounted) return;

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
            if (payload.new?.is_active && isMounted) {
              fetchActiveSession();
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
            if (!isMounted) return;

            const wasActive = payload.old?.is_active === true;
            const isNowInactive = payload.new?.is_active === false;

            if (isNowInactive && wasActive) {
              setSession(null);
            } else {
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
          () => {
            if (isMounted) {
              setSession(null);
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    return () => {
      isMounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>
            Loading...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.text}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.logo, { color: colors.text }]}>ANCHOR</Text>
      </View>

      <View style={styles.content}>
        {session ? (
          <SessionCard
            session={session}
            onStop={deactivateSession}
            isLoading={isStopping}
            isScanning={isScanning}
            isDarkMode={isDarkMode}
          />
        ) : (
          <View style={styles.emptyState}>
            <Image
              source={require("@/assets/images/anchor-icon.png")}
              style={styles.anchorLogo}
              accessibilityLabel="Anchor Logo"
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Active Session
            </Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
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
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyEmoji: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
  },
  anchorLogo: {
    width: 100,
    height: 100,
    alignSelf: "center",
    marginBottom: 24,
  },
});
