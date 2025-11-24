import { createClient } from "@supabase/supabase-js";

// Type declaration for process.env (injected by webpack DefinePlugin)
declare const process: {
  env: {
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
  };
};

// Supabase configuration
// TODO: Replace these with your actual Supabase project URL and anon key
const SUPABASE_URL = process.env.SUPABASE_URL || "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || "YOUR_SUPABASE_ANON_KEY";

console.log("Supabase config check:", {
  url: SUPABASE_URL?.substring(0, 50),
  urlLength: SUPABASE_URL?.length,
  hasKey: !!SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== "YOUR_SUPABASE_ANON_KEY",
  keyLength: SUPABASE_ANON_KEY?.length,
  isPlaceholder: SUPABASE_URL === "YOUR_SUPABASE_URL",
});

if (
  SUPABASE_URL === "YOUR_SUPABASE_URL" ||
  SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY"
) {
  console.warn(
    "⚠️ Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file or environment variables"
  );
}

let supabaseClient: ReturnType<typeof createClient>;

try {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false, // We'll handle session persistence manually in Chrome storage
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  });
} catch (error) {
  console.error("Error initializing Supabase client:", error);
  // Create a dummy client to prevent crashes
  supabaseClient = createClient(
    "https://placeholder.supabase.co",
    "placeholder-key",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}

export const supabase = supabaseClient;

// Helper function to get session from Chrome storage
export async function getStoredSession() {
  return new Promise<any>((resolve) => {
    chrome.storage.local.get(["supabase_session"], (result) => {
      resolve(result.supabase_session || null);
    });
  });
}

// Helper function to save session to Chrome storage
export async function saveSession(session: any) {
  return new Promise<void>((resolve) => {
    chrome.storage.local.set({ supabase_session: session }, () => {
      resolve();
    });
  });
}

// Helper function to clear session from Chrome storage
export async function clearSession() {
  return new Promise<void>((resolve) => {
    chrome.storage.local.remove(["supabase_session"], () => {
      resolve();
    });
  });
}

// Initialize session from storage
export async function initializeSession() {
  const storedSession = await getStoredSession();
  if (storedSession) {
    try {
      // setSession expects an object with access_token and refresh_token
      const { data, error } = await supabase.auth.setSession({
        access_token: storedSession.access_token,
        refresh_token: storedSession.refresh_token,
      });

      if (error) {
        // If session is invalid, try refreshing the token
        if (
          error.message?.includes("expired") ||
          error.message?.includes("invalid")
        ) {
          console.log("Session expired, attempting to refresh token...");
          const { data: refreshData, error: refreshError } =
            await supabase.auth.refreshSession({
              refresh_token: storedSession.refresh_token,
            });

          if (refreshError || !refreshData.session) {
            console.error("Error refreshing session:", refreshError);
            await clearSession();
            return null;
          }

          // Save the refreshed session
          await saveSession({
            access_token: refreshData.session.access_token,
            refresh_token: refreshData.session.refresh_token,
          });

          return refreshData.session;
        } else {
          console.error("Error restoring session:", error);
          await clearSession();
          return null;
        }
      }

      // If session is valid, check if it needs refresh and update storage
      if (data.session) {
        // Save the session again to ensure it's up to date
        await saveSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });
      }

      return data.session;
    } catch (err) {
      console.error("Error restoring session:", err);
      await clearSession();
      return null;
    }
  }
  return null;
}
