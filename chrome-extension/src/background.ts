// Background service worker for Anchor Website Blocker
console.log("Anchor Website Blocker background service worker loaded!");

import { supabase, getStoredSession } from "./lib/supabase";

// Storage keys
const STORAGE_KEYS = {
  MODES: "modes",
  ACTIVE_MODE: "active_mode",
  USER_SESSION: "user_session",
  ACTIVE_UNLOCKS: "active_unlocks",
};

// Flag to prevent infinite loops when syncing from Supabase
let isSyncingFromSupabase = false;
let blockingSessionsChannel: ReturnType<typeof supabase.channel> | null = null;
let blockingSessionsChannelUserId: string | null = null;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed/updated");
  // Initialize storage with empty modes list
  chrome.storage.local.get([STORAGE_KEYS.MODES], (result) => {
    if (!result[STORAGE_KEYS.MODES]) {
      chrome.storage.local.set({ [STORAGE_KEYS.MODES]: [] });
    }
  });
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);

  switch (message.type) {
    case "GET_MODES":
      getModes().then((modes) => {
        sendResponse({ success: true, data: modes });
      });
      return true;

    case "GET_ACTIVE_MODE":
      getActiveMode().then((mode) => {
        sendResponse({ success: true, data: mode });
      });
      return true;

    case "CREATE_MODE":
      createMode(message.mode)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case "UPDATE_MODE":
      updateMode(message.modeId, message.mode)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case "DELETE_MODE":
      deleteMode(message.modeId)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case "START_BLOCKING_SESSION":
      startBlockingSession(message.modeId)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case "STOP_BLOCKING_SESSION":
      stopBlockingSession()
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case "REQUEST_UNLOCK":
      requestUnlock(message.url)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case "SYNC_SESSION_STATE":
      syncLocalStateWithSupabase("manual-request")
        .then(async () => {
          const mode = await getActiveMode();
          sendResponse({ success: true, data: mode });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;

    case "INIT_REALTIME_SUBSCRIPTION":
      initializeRealtimeSubscription(true)
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
      return true;

    default:
      sendResponse({ success: false, error: "Unknown message type" });
  }
});

// Get all modes from storage
async function getModes(): Promise<any[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.MODES], (result) => {
      resolve(result[STORAGE_KEYS.MODES] || []);
    });
  });
}

// Get active mode
async function getActiveMode(): Promise<any | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.ACTIVE_MODE], (result) => {
      resolve(result[STORAGE_KEYS.ACTIVE_MODE] || null);
    });
  });
}

// Get current user session from Supabase
async function getCurrentUserSession() {
  try {
    const storedSession = await getStoredSession();
    console.log(
      "Getting user session. Stored session exists:",
      !!storedSession
    );

    if (storedSession) {
      const { data, error } = await supabase.auth.setSession({
        access_token: storedSession.access_token,
        refresh_token: storedSession.refresh_token,
      });
      if (error) {
        console.error("Error setting session:", error);
        return null;
      }
      console.log(
        "Session restored successfully. User ID:",
        data.session?.user?.id
      );
      return data.session;
    } else {
      // Try getting current session directly
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting current session:", error);
        return null;
      }
      if (session) {
        console.log("Found active session. User ID:", session.user?.id);
        return session;
      }
      console.log("No stored session found");
      return null;
    }
  } catch (error) {
    console.error("Error getting user session:", error);
    return null;
  }
}

type BlockingSessionRecord = {
  id: string;
  user_id: string;
  mode_id: string;
  mode_name: string;
  websites: string[];
  is_active: boolean;
  started_at: string | null;
  stopped_at: string | null;
  created_at: string;
};

async function fetchActiveBlockingSessionRecord(
  userId: string
): Promise<BlockingSessionRecord | null> {
  try {
    const { data, error } = await supabase
      .from("blocking_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("started_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("Error fetching active session from Supabase:", error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0] as BlockingSessionRecord;
    }

    return null;
  } catch (error) {
    console.error("Error querying Supabase for active session:", error);
    return null;
  }
}

function haveSameWebsites(a: string[] = [], b: string[] = []) {
  if (a.length !== b.length) {
    return false;
  }

  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }

  return true;
}

async function syncLocalStateWithSupabase(
  triggerSource: string = "manual"
): Promise<any | null> {
  const session = await getCurrentUserSession();

  if (!session || !session.user) {
    console.log(
      `[Sync] Skipping Supabase sync (${triggerSource}): no authenticated user`
    );
    return null;
  }

  console.log(
    `[Sync] Checking Supabase for active session (${triggerSource})...`
  );

  const remoteActiveSession = await fetchActiveBlockingSessionRecord(
    session.user.id
  );

  isSyncingFromSupabase = true;

  try {
    const localActiveMode = await getActiveMode();

    if (!remoteActiveSession) {
      if (localActiveMode) {
        console.log(
          "[Sync] Remote session inactive. Stopping local blocking session."
        );
        await stopBlockingSession();
      } else {
        console.log("[Sync] No remote or local session active. Nothing to do.");
      }

      return null;
    }

    const restoredMode = {
      id: remoteActiveSession.mode_id,
      name: remoteActiveSession.mode_name,
      websites: remoteActiveSession.websites || [],
      created_at:
        remoteActiveSession.started_at ||
        remoteActiveSession.created_at ||
        new Date().toISOString(),
    };

    const needsUpdate =
      !localActiveMode ||
      localActiveMode.id !== restoredMode.id ||
      localActiveMode.name !== restoredMode.name ||
      !haveSameWebsites(
        localActiveMode.websites || [],
        restoredMode.websites || []
      );

    if (needsUpdate) {
      console.log(
        `[Sync] Applying Supabase session "${restoredMode.name}" locally.`
      );
      await chrome.storage.local.set({
        [STORAGE_KEYS.ACTIVE_MODE]: restoredMode,
      });
      await updateBlockingRules(restoredMode.websites);
    } else {
      console.log("[Sync] Local session already matches Supabase.");
    }

    return restoredMode;
  } catch (error) {
    console.error("Error syncing local state with Supabase:", error);
    return null;
  } finally {
    isSyncingFromSupabase = false;
  }
}

// Create a new mode
async function createMode(mode: { name: string; websites: string[] }) {
  const modes = await getModes();
  const newMode = {
    id: Date.now().toString(),
    name: mode.name,
    websites: mode.websites || [],
    created_at: new Date().toISOString(),
  };

  modes.push(newMode);
  await chrome.storage.local.set({ [STORAGE_KEYS.MODES]: modes });

  console.log("Created mode:", newMode);
}

// Update a mode
async function updateMode(
  modeId: string,
  mode: { name: string; websites: string[] }
) {
  const modes = await getModes();
  const index = modes.findIndex((m) => m.id === modeId);

  if (index === -1) {
    throw new Error("Mode not found");
  }

  modes[index] = {
    ...modes[index],
    name: mode.name,
    websites: mode.websites || [],
  };

  await chrome.storage.local.set({ [STORAGE_KEYS.MODES]: modes });

  // If this mode is active, update the blocking rules
  const activeMode = await getActiveMode();
  if (activeMode && activeMode.id === modeId) {
    await updateBlockingRules(mode.websites);
  }

  console.log("Updated mode:", modeId);
}

// Delete a mode
async function deleteMode(modeId: string) {
  const modes = await getModes();
  const updatedModes = modes.filter((mode) => mode.id !== modeId);

  await chrome.storage.local.set({ [STORAGE_KEYS.MODES]: updatedModes });

  // If this mode was active, stop the blocking session
  const activeMode = await getActiveMode();
  if (activeMode && activeMode.id === modeId) {
    await stopBlockingSession();
  }

  console.log("Deleted mode:", modeId);
}

// Start a blocking session with a specific mode
// Requires that no other session is currently active
async function startBlockingSession(modeId: string) {
  const modes = await getModes();
  const mode = modes.find((m) => m.id === modeId);

  if (!mode) {
    throw new Error("Mode not found");
  }

  // Check if there's already an active session
  const activeMode = await getActiveMode();
  if (activeMode && activeMode.id !== modeId) {
    throw new Error(
      `A blocking session is already active with "${activeMode.name}". Please stop it first before starting a new one.`
    );
  }

  // If the same mode is already active, do nothing
  if (activeMode && activeMode.id === modeId) {
    return;
  }

  // Start new session locally
  await chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_MODE]: mode });
  await updateBlockingRules(mode.websites);

  // Sync to Supabase
  try {
    const session = await getCurrentUserSession();
    console.log("Attempting to sync session to Supabase. User session:", {
      hasSession: !!session,
      hasUser: !!(session && session.user),
      userId: session?.user?.id,
    });

    if (!session || !session.user) {
      console.warn(
        "⚠️ Cannot sync to Supabase: User not authenticated. Please sign in first."
      );
      return;
    }

    // First, deactivate any existing active session for this user
    console.log("Deactivating any existing active sessions...");
    const { error: deactivateError } = await (
      supabase.from("blocking_sessions") as any
    )
      .update({
        is_active: false,
        stopped_at: new Date().toISOString(),
      })
      .eq("user_id", session.user.id)
      .eq("is_active", true);

    if (deactivateError) {
      console.error("Error deactivating existing session:", deactivateError);
    } else {
      console.log("Successfully deactivated existing sessions");
    }

    // Then create new active session
    console.log("Creating new active session in Supabase...", {
      userId: session.user.id,
      modeId: mode.id,
      modeName: mode.name,
      websitesCount: mode.websites.length,
    });

    const { data, error: insertError } = await (
      supabase.from("blocking_sessions") as any
    ).insert({
      user_id: session.user.id,
      mode_id: mode.id,
      mode_name: mode.name,
      websites: mode.websites,
      is_active: true,
      started_at: new Date().toISOString(),
    });

    if (insertError) {
      console.error("❌ Error syncing session to Supabase:", insertError);
      console.error("Error details:", JSON.stringify(insertError, null, 2));
      // Don't throw - local session is already started
    } else {
      console.log("✅ Successfully synced blocking session to Supabase", {
        insertedId: data?.[0]?.id,
      });
    }
  } catch (error) {
    console.error("❌ Exception while syncing to Supabase:", error);
    console.error("Error stack:", error instanceof Error ? error.stack : error);
    // Don't throw - local session is already started
  }

  console.log("Started blocking session with mode:", mode.name);
}

// Stop the current blocking session
async function stopBlockingSession() {
  // Stop locally first
  await chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_MODE]: null });
  await updateBlockingRules([]);

  // Sync to Supabase (only if not already syncing from Supabase to prevent loops)
  if (!isSyncingFromSupabase) {
    try {
      const session = await getCurrentUserSession();
      if (session && session.user) {
        const { error } = await (supabase.from("blocking_sessions") as any)
          .update({
            is_active: false,
            stopped_at: new Date().toISOString(),
          })
          .eq("user_id", session.user.id)
          .eq("is_active", true);

        if (error) {
          console.error("Error syncing stop to Supabase:", error);
        } else {
          console.log("Synced session stop to Supabase");
        }
      }
    } catch (error) {
      console.error("Error syncing stop to Supabase:", error);
      // Don't throw - local session is already stopped
    }
  }

  console.log("Stopped blocking session");
}

// Update declarativeNetRequest rules based on websites list
async function updateBlockingRules(websites: string[]) {
  // Get current rule IDs
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map((rule) => rule.id);

  // Create new rules from websites list
  const newRules: any[] = [];
  let ruleId = 1;

  websites.forEach((website) => {
    const domain = website.trim();

    // If domain already contains wildcards, use it as-is
    if (domain.includes("*")) {
      newRules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: {
            url: chrome.runtime.getURL(
              `blocked.html?site=${encodeURIComponent(domain)}`
            ),
          },
        },
        condition: {
          urlFilter: domain,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      });
    } else {
      // For exact domains, create rules that match:
      // 1. The exact domain (e.g., youtube.com)
      // 2. www subdomain (e.g., www.youtube.com)
      // But NOT other subdomains (e.g., music.youtube.com)

      // Rule for exact domain: *://youtube.com/*
      newRules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: {
            url: chrome.runtime.getURL(
              `blocked.html?site=${encodeURIComponent(domain)}`
            ),
          },
        },
        condition: {
          urlFilter: `*://${domain}/*`,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      });

      // Rule for www subdomain: *://www.youtube.com/*
      newRules.push({
        id: ruleId++,
        priority: 1,
        action: {
          type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
          redirect: {
            url: chrome.runtime.getURL(
              `blocked.html?site=${encodeURIComponent(domain)}`
            ),
          },
        },
        condition: {
          urlFilter: `*://www.${domain}/*`,
          resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
        },
      });
    }
  });

  // Update rules
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existingRuleIds,
    addRules: newRules,
  });

  console.log("Updated blocking rules:", newRules.length, "rules active");
}

// Request unlock (placeholder for now - will integrate with Supabase later)
async function requestUnlock(url: string) {
  console.log("Unlock requested for:", url);
  // TODO: Send unlock request to Supabase
  // TODO: Trigger push notification to mobile app
  // For now, just log it
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icon48.png",
    title: "Unlock Request Sent",
    message: `Waiting for NFC verification to unlock ${url}`,
  });
}

// Listen for alarms (for temporary unlocks)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name.startsWith("reblock_")) {
    const siteId = alarm.name.replace("reblock_", "");
    console.log("Re-blocking site:", siteId);
    // TODO: Re-enable blocking rule
  }
});

// Restore active session from Supabase on startup
async function restoreActiveSessionFromSupabase() {
  try {
    await syncLocalStateWithSupabase("startup");
  } catch (error) {
    console.error("Error restoring session from Supabase:", error);
  }
}

// Initialize real-time subscription for blocking sessions
async function initializeRealtimeSubscription(force = false) {
  try {
    const session = await getCurrentUserSession();
    if (!session || !session.user) {
      console.log(
        "Skipping real-time subscription: user is not authenticated."
      );
      return;
    }

    if (
      !force &&
      blockingSessionsChannel &&
      blockingSessionsChannelUserId === session.user.id
    ) {
      console.log(
        "Real-time subscription already active for user:",
        session.user.id
      );
      return;
    }

    if (blockingSessionsChannel) {
      try {
        await supabase.removeChannel(blockingSessionsChannel);
      } catch (channelError) {
        console.warn(
          "Error removing existing real-time channel:",
          channelError
        );
      }
      blockingSessionsChannel = null;
      blockingSessionsChannelUserId = null;
    }

    const handleChange = async (payload: any) => {
      console.log("Received blocking session change from Supabase:", {
        eventType: payload.eventType,
        newValue: payload.new,
        oldValue: payload.old,
      });

      try {
        await syncLocalStateWithSupabase(`realtime:${payload.eventType}`);
      } catch (error) {
        console.error("Error syncing state after realtime payload:", error);
      }
    };

    const channelName = `blocking_sessions_changes_${session.user.id}`;

    blockingSessionsChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "blocking_sessions",
          filter: `user_id=eq.${session.user.id}`,
        },
        handleChange
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "blocking_sessions",
          filter: `user_id=eq.${session.user.id}`,
        },
        handleChange
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "blocking_sessions",
          filter: `user_id=eq.${session.user.id}`,
        },
        handleChange
      )
      .subscribe((status) => {
        console.log("Blocking sessions channel status:", status);
      });

    blockingSessionsChannelUserId = session.user.id;

    console.log("Initialized real-time subscription for blocking sessions");
  } catch (error) {
    console.error("Error initializing real-time subscription:", error);
  }
}

// Initialize on startup
(async () => {
  // Restore blocking rules from local storage first
  const activeMode = await getActiveMode();
  if (activeMode && activeMode.websites) {
    updateBlockingRules(activeMode.websites);
  }

  // Then restore from Supabase and set up real-time subscription
  await restoreActiveSessionFromSupabase();
  await initializeRealtimeSubscription();
})();
