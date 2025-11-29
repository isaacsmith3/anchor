import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { Colors } from "@/constants/theme";

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const colors = Colors.light;

  const clearStoredSession = async () => {
    try {
      const keys = [
        "sb-dvyburibnizilwwvocom-auth-token",
        "supabase.auth.token",
      ];
      for (const key of keys) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch {
          // Key might not exist, that's fine
        }
      }
      await supabase.auth.signOut();
    } catch (error) {
      console.log("Error clearing stored session:", error);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        const normalizedEmail = email.trim().toLowerCase();
        await clearStoredSession();
        await new Promise((resolve) => setTimeout(resolve, 300));

        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) throw error;

        if (data.session) {
          router.replace("/(tabs)" as any);
        }
      } else {
        const normalizedEmail = email.trim().toLowerCase();
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });

        if (error) throw error;

        if (data.session) {
          router.replace("/(tabs)" as any);
        } else {
          Alert.alert(
            "Check your email",
            "Please check your email to confirm your account before signing in."
          );
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.message?.includes("Network request failed")) {
        setError("Network error: Please check your internet connection.");
      } else if (err.message?.includes("Invalid login credentials")) {
        setError("Invalid email or password");
      } else {
        setError(err.message || "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>ANCHOR</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isLogin ? "Welcome back" : "Create account"}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {isLogin
              ? "Sign in to manage your blocking sessions"
              : "Sign up to get started with Anchor"}
          </Text>

          {error && (
            <View
              style={[styles.errorContainer, { borderColor: colors.border }]}
            >
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Enter your email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Password</Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.inputBorder,
                  color: colors.text,
                },
              ]}
              placeholder="Enter your password"
              placeholderTextColor={colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.text,
                borderColor: colors.text,
              },
              isLoading && styles.buttonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.buttonText, { color: colors.background }]}>
                {isLogin ? "Sign In" : "Sign Up"}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => {
              setIsLogin(!isLogin);
              setError(null);
              setPassword("");
            }}
          >
            <Text style={[styles.switchText, { color: colors.textMuted }]}>
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
              <Text style={{ color: colors.text, fontWeight: "600" }}>
                {isLogin ? "Sign up" : "Sign in"}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginTop: 80,
    marginBottom: 60,
  },
  logo: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 2,
    color: "#0f0f0f",
  },
  form: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    marginBottom: 40,
    textAlign: "center",
    lineHeight: 22,
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
  },
  button: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  switchButton: {
    marginTop: 32,
    alignItems: "center",
  },
  switchText: {
    fontSize: 14,
  },
});
