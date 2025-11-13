// Background service worker for Anchor Website Blocker
console.log("Anchor Website Blocker background service worker loaded!");

// Storage keys
const STORAGE_KEYS = {
  MODES: "modes",
  ACTIVE_MODE: "active_mode",
  USER_SESSION: "user_session",
  ACTIVE_UNLOCKS: "active_unlocks",
};

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
async function startBlockingSession(modeId: string) {
  const modes = await getModes();
  const mode = modes.find((m) => m.id === modeId);

  if (!mode) {
    throw new Error("Mode not found");
  }

  await chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_MODE]: mode });
  await updateBlockingRules(mode.websites);

  console.log("Started blocking session with mode:", mode.name);
}

// Stop the current blocking session
async function stopBlockingSession() {
  await chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_MODE]: null });
  await updateBlockingRules([]);

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

// Reload blocking rules on startup
getActiveMode().then((activeMode) => {
  if (activeMode && activeMode.websites) {
    updateBlockingRules(activeMode.websites);
  }
});
