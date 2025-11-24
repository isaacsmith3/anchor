import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearStoredSession = async () => {
    try {
      // Clear all Supabase-related keys from SecureStore
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
      // Also sign out from Supabase
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
        console.log("Signing in with email:", normalizedEmail);
        console.log("Password length:", password.length);

        // Verify Supabase client configuration before attempting login
        const clientUrl = (supabase as any).supabaseUrl;
        console.log("Supabase client URL:", clientUrl);

        // Clear any stale session data before attempting login
        await clearStoredSession();
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Login
        console.log("Attempting login with:", {
          email: normalizedEmail,
          passwordLength: password.length,
        });

        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        console.log("Sign in response:", {
          hasSession: !!data.session,
          hasUser: !!data.user,
          error: error
            ? {
                message: error.message,
                status: error.status,
                name: error.name,
              }
            : null,
        });

        if (error) {
          console.error("Login error details:", {
            message: error.message,
            status: error.status,
            name: error.name,
            email: normalizedEmail,
            emailLength: normalizedEmail.length,
          });
          throw error;
        }

        if (data.session) {
          // Navigate to main app
          router.replace("/(tabs)" as any);
        }
      } else {
        // Sign up
        const normalizedEmail = email.trim().toLowerCase();
        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
        });

        if (error) throw error;

        if (data.session) {
          // User is automatically signed in after signup
          router.replace("/(tabs)" as any);
        } else {
          // Email confirmation required
          Alert.alert(
            "Check your email",
            "Please check your email to confirm your account before signing in."
          );
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      // Provide more helpful error messages
      if (err.message?.includes("Network request failed")) {
        setError(
          "Network error: Please check your internet connection and ensure Supabase credentials are configured correctly."
        );
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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>⚓</Text>
        <Text style={styles.title}>Anchor</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.subtitle}>
          {isLogin ? "Welcome Back" : "Create Account"}
        </Text>
        <Text style={styles.description}>
          {isLogin
            ? "Sign in to manage your blocking sessions"
            : "Sign up to get started with Anchor"}
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
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
          <Text style={styles.switchText}>
            {isLogin
              ? "Don't have an account? Sign up"
              : "Already have an account? Sign in"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 40,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
  },
  form: {
    flex: 1,
  },
  subtitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#000",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 32,
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "#fee",
    borderColor: "#fcc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#c33",
    fontSize: 14,
  },
  input: {
    backgroundColor: "#f5f5f5",
    borderWidth: 2,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    color: "#000",
  },
  button: {
    backgroundColor: "#0066ff",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  switchButton: {
    marginTop: 24,
    alignItems: "center",
  },
  switchText: {
    color: "#0066ff",
    fontSize: 14,
    fontWeight: "500",
  },
});
