import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

// Load environment variables from app.config.js extra field or process.env
// Expo loads EXPO_PUBLIC_ prefixed vars and makes them available via Constants
const expoExtra =
  Constants.expoConfig?.extra ||
  Constants.manifestExtra ||
  (Constants as any).manifest?.extra ||
  {};

const SUPABASE_URL =
  expoExtra.supabaseUrl ||
  (typeof process !== "undefined" &&
    (process.env?.EXPO_PUBLIC_SUPABASE_URL || process.env?.SUPABASE_URL)) ||
  "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY =
  expoExtra.supabaseAnonKey ||
  (typeof process !== "undefined" &&
    (process.env?.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      process.env?.SUPABASE_ANON_KEY)) ||
  "YOUR_SUPABASE_ANON_KEY";

// Debug logging
console.log("Supabase config check:", {
  hasExtraUrl: !!Constants.expoConfig?.extra?.supabaseUrl,
  hasExtraKey: !!Constants.expoConfig?.extra?.supabaseAnonKey,
  urlPreview: SUPABASE_URL?.substring(0, 30) + "...",
  hasKey: !!SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY",
});

// Custom storage adapter for Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    await SecureStore.deleteItemAsync(key);
  },
};

if (
  SUPABASE_URL === "YOUR_SUPABASE_URL" ||
  SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY"
) {
  console.warn(
    "⚠️ Supabase credentials not configured. Please set EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL / SUPABASE_ANON_KEY) in your .env file or app.config.js extra."
  );
}

let supabaseClient: ReturnType<typeof createClient>;

// Validate URL before creating client
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

if (
  SUPABASE_URL === "YOUR_SUPABASE_URL" ||
  SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY" ||
  !isValidUrl(SUPABASE_URL)
) {
  console.error(
    "⚠️ Supabase credentials not configured properly. Ensure EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL / SUPABASE_ANON_KEY) are set and restart the dev server."
  );
  // Create a dummy client that will fail gracefully
  supabaseClient = createClient(
    "https://placeholder.supabase.co",
    "placeholder-key",
    {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
} else {
  try {
    console.log("Creating Supabase client with:", {
      url: SUPABASE_URL?.substring(0, 40) + "...",
      keyLength: SUPABASE_ANON_KEY?.length,
      keyPreview: SUPABASE_ANON_KEY?.substring(0, 20) + "...",
    });
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    console.log("Supabase client created successfully");
    // Verify the client has the correct URL
    const clientUrl = (supabaseClient as any).supabaseUrl;
    console.log("Client URL:", clientUrl?.substring(0, 40) + "...");
  } catch (error) {
    console.error("Error initializing Supabase client:", error);
    // Create a dummy client to prevent crashes
    supabaseClient = createClient(
      "https://placeholder.supabase.co",
      "placeholder-key",
      {
        auth: {
          storage: ExpoSecureStoreAdapter,
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      }
    );
  }
}

export const supabase = supabaseClient;
