import React, { useState, useEffect } from "react";
import {
  supabase,
  initializeSession,
  clearSession,
  saveSession,
} from "../lib/supabase";
import Auth from "./Auth";

interface Mode {
  id: string;
  name: string;
  websites: string[];
  created_at: string;
}

type View = "blocking" | "modes" | "profile";

const Popup: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState<any>(null);
  const [currentView, setCurrentView] = useState<View>("blocking");
  const [modes, setModes] = useState<Mode[]>([]);
  const [activeMode, setActiveMode] = useState<Mode | null>(null);
  const [selectedModeId, setSelectedModeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mode creation/editing state
  const [editingMode, setEditingMode] = useState<Mode | null>(null);
  const [modeName, setModeName] = useState("");
  const [websiteInput, setWebsiteInput] = useState("");
  const [websites, setWebsites] = useState<string[]>([]);

  // Check authentication status on mount
  useEffect(() => {
    console.log("Popup: Component mounted, checking auth...");
    checkAuth();
  }, []);

  // Load modes and active mode when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    loadModes();
    loadActiveMode();

    const initializeRealtimeSync = async () => {
      try {
        await chrome.runtime.sendMessage({
          type: "INIT_REALTIME_SUBSCRIPTION",
        });
      } catch (error) {
        console.error("Error initializing real-time subscription:", error);
      }

      await syncActiveModeWithSupabase();
    };

    initializeRealtimeSync();
  }, [isAuthenticated]);

  // Listen for auth state changes and token refresh
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "Auth state changed:",
        event,
        session ? "session exists" : "no session"
      );

      if (session) {
        setUser(session.user);
        setIsAuthenticated(true);

        // Save session whenever it changes (including token refresh)
        if (event === "TOKEN_REFRESHED" || event === "SIGNED_IN") {
          await saveSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });
          console.log("Session saved after", event);
        }
      } else {
        // Only clear session if explicitly signed out
        if (event === "SIGNED_OUT") {
          setUser(null);
          setIsAuthenticated(false);
          await clearSession();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      areaName: string
    ) => {
      if (areaName !== "local") {
        return;
      }

      if (Object.prototype.hasOwnProperty.call(changes, "active_mode")) {
        setActiveMode(changes.active_mode.newValue || null);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const checkAuth = async () => {
    try {
      // First try to restore session from storage
      const session = await initializeSession();
      if (session && session.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        return;
      }

      // If no stored session, check if there's an active session
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (currentSession && currentSession.user) {
        // Save this session to storage for future use
        await saveSession({
          access_token: currentSession.access_token,
          refresh_token: currentSession.refresh_token,
        });
        setUser(currentSession.user);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      setIsAuthenticated(false);
    }
  };

  const handleAuthSuccess = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      setUser(session.user);
      setIsAuthenticated(true);
      try {
        await syncActiveModeWithSupabase();
      } catch (error) {
        console.error("Error syncing state after login:", error);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    await clearSession();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Redirect to blocking view if a session becomes active while on modes page
  useEffect(() => {
    if (activeMode && currentView === "modes") {
      setCurrentView("blocking");
    }
  }, [activeMode, currentView]);

  // Set selected mode to active mode when it changes
  useEffect(() => {
    if (activeMode) {
      setSelectedModeId(activeMode.id);
    } else if (modes.length > 0 && !selectedModeId) {
      // If no active mode and no selection, select first mode
      setSelectedModeId(modes[0].id);
    }
  }, [activeMode, modes]);

  // Update body and html background for dark mode
  useEffect(() => {
    const isDarkMode = !!activeMode;
    document.body.style.backgroundColor = isDarkMode ? "#0f0f0f" : "#ffffff";
    document.documentElement.style.backgroundColor = isDarkMode
      ? "#0f0f0f"
      : "#ffffff";

    return () => {
      // Cleanup on unmount
      document.body.style.backgroundColor = "";
      document.documentElement.style.backgroundColor = "";
    };
  }, [activeMode]);

  const loadModes = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GET_MODES",
      });

      if (response.success) {
        setModes(response.data);
      }
    } catch (error) {
      console.error("Error loading modes:", error);
    }
  };

  const loadActiveMode = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "GET_ACTIVE_MODE",
      });

      if (response.success) {
        setActiveMode(response.data);
      }
    } catch (error) {
      console.error("Error loading active mode:", error);
    }
  };

  const syncActiveModeWithSupabase = async () => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: "SYNC_SESSION_STATE",
      });

      if (response?.success) {
        setActiveMode(response.data);
      }
    } catch (error) {
      console.error("Error syncing active mode with Supabase:", error);
    }
  };

  const handleCreateMode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (activeMode) {
      alert(
        `Cannot create or edit modes while a blocking session is active. Please stop the session with "${activeMode.name}" first.`
      );
      return;
    }

    if (!modeName.trim()) {
      alert("Please enter a mode name");
      return;
    }

    if (websites.length === 0) {
      alert("Please add at least one website");
      return;
    }

    setIsLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: editingMode ? "UPDATE_MODE" : "CREATE_MODE",
        modeId: editingMode?.id,
        mode: {
          name: modeName.trim(),
          websites: websites,
        },
      });

      if (response.success) {
        setModeName("");
        setWebsiteInput("");
        setWebsites([]);
        setEditingMode(null);
        await loadModes();
      } else {
        alert("Failed to save mode: " + response.error);
      }
    } catch (error) {
      console.error("Error saving mode:", error);
      alert("Error saving mode");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWebsite = () => {
    if (!websiteInput.trim()) {
      return;
    }

    const website = websiteInput.trim();
    if (!websites.includes(website)) {
      setWebsites([...websites, website]);
      setWebsiteInput("");
    }
  };

  const handleRemoveWebsite = (website: string) => {
    setWebsites(websites.filter((w) => w !== website));
  };

  const handleEditMode = (mode: Mode) => {
    if (activeMode) {
      alert(
        `Cannot edit modes while a blocking session is active. Please stop the session with "${activeMode.name}" first.`
      );
      return;
    }
    setEditingMode(mode);
    setModeName(mode.name);
    setWebsites([...mode.websites]);
    setWebsiteInput("");
  };

  const handleCancelEdit = () => {
    setEditingMode(null);
    setModeName("");
    setWebsiteInput("");
    setWebsites([]);
  };

  const handleDeleteMode = async (modeId: string) => {
    if (activeMode) {
      alert(
        `Cannot delete modes while a blocking session is active. Please stop the session with "${activeMode.name}" first.`
      );
      return;
    }

    if (!confirm("Are you sure you want to delete this mode?")) {
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: "DELETE_MODE",
        modeId: modeId,
      });

      if (response.success) {
        await loadModes();
        await loadActiveMode();
      } else {
        alert("Failed to delete mode: " + response.error);
      }
    } catch (error) {
      console.error("Error deleting mode:", error);
      alert("Error deleting mode");
    }
  };

  const handleToggleBlocking = async () => {
    if (!selectedModeId) {
      return;
    }

    // If the selected mode is already active, stop it
    if (activeMode && activeMode.id === selectedModeId) {
      await handleStopBlocking();
      return;
    }

    // If there's already an active session with a different mode, show error
    if (activeMode && activeMode.id !== selectedModeId) {
      alert(
        `A blocking session is already active with "${activeMode.name}". Please stop it first before starting a new one.`
      );
      return;
    }

    // Start the selected mode
    setIsLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: "START_BLOCKING_SESSION",
        modeId: selectedModeId,
      });

      if (response.success) {
        await loadActiveMode();
      } else {
        alert("Failed to start blocking session: " + response.error);
      }
    } catch (error) {
      console.error("Error starting blocking session:", error);
      alert("Error starting blocking session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopBlocking = async () => {
    setIsLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: "STOP_BLOCKING_SESSION",
      });

      if (response.success) {
        await loadActiveMode();
      } else {
        alert("Failed to stop blocking session: " + response.error);
      }
    } catch (error) {
      console.error("Error stopping blocking session:", error);
      alert("Error stopping blocking session");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    console.log("Popup: Loading authentication state...");
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          minWidth: "400px",
          minHeight: "100%",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 0",
          backgroundColor: "#ffffff",
          color: "#0f0f0f",
        }}
      >
        <div style={{ fontSize: "24px", marginBottom: "8px" }}>⚓</div>
        <p style={{ fontSize: "14px", color: "#737373" }}>Loading...</p>
      </div>
    );
  }

  // Show auth component if not authenticated
  if (!isAuthenticated) {
    return <Auth onAuthSuccess={handleAuthSuccess} />;
  }

  const isDarkMode = !!activeMode;

  // Color definitions
  const colors = {
    bg: isDarkMode ? "#0f0f0f" : "#ffffff",
    text: isDarkMode ? "#ffffff" : "#0f0f0f",
    textMuted: isDarkMode ? "#737373" : "#737373",
    border: isDarkMode ? "#262626" : "#e5e5e5",
    cardBg: isDarkMode ? "#171717" : "#fafafa",
    inputBorder: isDarkMode ? "#404040" : "#d4d4d4",
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        minWidth: "400px",
        minHeight: "100%",
        backgroundColor: colors.bg,
        color: colors.text,
        transition: "all 0.3s ease",
      }}
    >
      {/* Header */}
      <header
        style={{
          padding: "28px 24px",
          textAlign: "center",
          backgroundColor: isDarkMode ? "#0f0f0f" : "#0f0f0f",
          color: "#ffffff",
        }}
      >
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          ANCHOR
        </h1>
      </header>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "32px",
          padding: "16px 0",
          backgroundColor: colors.bg,
        }}
      >
        {(["blocking", "modes", "profile"] as View[]).map((tab) => {
          const isActive = currentView === tab;
          const isDisabled = activeMode && tab !== "blocking";
          return (
            <button
              key={tab}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                fontSize: "12px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                background: "none",
                border: "none",
                cursor: isDisabled ? "not-allowed" : "pointer",
                opacity: isDisabled ? 0.4 : 1,
                color: isActive ? colors.text : colors.textMuted,
                fontWeight: isActive ? 700 : 500,
                padding: 0,
              }}
              onClick={() => {
                if (tab === "blocking") {
                  setCurrentView("blocking");
                } else if (!activeMode) {
                  setCurrentView(tab);
                } else {
                  alert(
                    `Cannot access ${tab} page while a blocking session is active. Please stop the session first.`
                  );
                }
              }}
              disabled={!!isDisabled}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  backgroundColor: isActive ? colors.text : "transparent",
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Content based on current view */}
      {currentView === "blocking" ? (
        <>
          <section
            style={{
              padding: "24px",
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.bg,
            }}
          >
            <h3
              style={{
                fontSize: "11px",
                fontWeight: 700,
                marginBottom: "16px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: colors.text,
              }}
            >
              <span
                style={{
                  width: "4px",
                  height: "16px",
                  backgroundColor: colors.text,
                  borderRadius: "2px",
                }}
              />
              Select Blocking Session
            </h3>
            {modes.length === 0 ? (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    margin: "0 auto 16px",
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: `1px solid ${colors.border}`,
                    backgroundColor: colors.cardBg,
                  }}
                >
                  <span style={{ fontSize: "28px" }}>📋</span>
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    marginBottom: "20px",
                    fontWeight: 500,
                    color: colors.textMuted,
                  }}
                >
                  No modes available
                </p>
                <button
                  style={{
                    padding: "10px 20px",
                    border: `2px solid ${colors.text}`,
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "12px",
                    cursor: "pointer",
                    backgroundColor: "transparent",
                    color: colors.text,
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => setCurrentView("modes")}
                >
                  Create Your First Mode
                </button>
              </div>
            ) : (
              <div
                style={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {modes.map((mode) => {
                  const isDisabled =
                    activeMode !== null && activeMode.id !== mode.id;
                  const isSelected = selectedModeId === mode.id;
                  const isActiveSession = activeMode?.id === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => {
                        if (!isDisabled) {
                          setSelectedModeId(mode.id);
                        }
                      }}
                      disabled={isDisabled}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: "16px",
                        borderRadius: "12px",
                        border: `2px solid ${
                          isSelected ? colors.text : colors.border
                        }`,
                        backgroundColor: isSelected ? colors.cardBg : colors.bg,
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        opacity: isDisabled ? 0.5 : 1,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontWeight: 700,
                              fontSize: "14px",
                              marginBottom: "4px",
                              color: colors.text,
                            }}
                          >
                            {mode.name}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              fontWeight: 500,
                              color: colors.textMuted,
                            }}
                          >
                            {mode.websites.length} website
                            {mode.websites.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                        {isSelected && (
                          <span
                            style={{
                              fontSize: "16px",
                              color: colors.text,
                            }}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {modes.length > 0 && selectedModeId && (
            <section
              style={{
                padding: "24px",
                backgroundColor: colors.bg,
              }}
            >
              <button
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "14px",
                  letterSpacing: "0.02em",
                  border: `2px solid ${colors.text}`,
                  backgroundColor:
                    activeMode && activeMode.id === selectedModeId
                      ? colors.text
                      : "transparent",
                  color:
                    activeMode && activeMode.id === selectedModeId
                      ? colors.bg
                      : colors.text,
                  cursor:
                    isLoading ||
                    (activeMode !== null && activeMode.id !== selectedModeId)
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    isLoading ||
                    (activeMode !== null && activeMode.id !== selectedModeId)
                      ? 0.6
                      : 1,
                  transition: "all 0.2s ease",
                }}
                onClick={handleToggleBlocking}
                disabled={
                  isLoading ||
                  (activeMode !== null && activeMode.id !== selectedModeId)
                }
              >
                {activeMode && activeMode.id === selectedModeId
                  ? isLoading
                    ? "Stopping..."
                    : "Deactivate Session"
                  : isLoading
                  ? "Starting..."
                  : "Activate Session"}
              </button>
              {activeMode && activeMode.id === selectedModeId && (
                <p
                  style={{
                    fontSize: "12px",
                    textAlign: "center",
                    marginTop: "12px",
                    color: colors.textMuted,
                  }}
                >
                  Currently blocking {activeMode.websites.length} website
                  {activeMode.websites.length !== 1 ? "s" : ""}
                </p>
              )}
            </section>
          )}
        </>
      ) : currentView === "modes" ? (
        <>
          <section
            style={{
              padding: "24px",
              borderBottom: `1px solid ${colors.border}`,
              backgroundColor: colors.bg,
            }}
          >
            <h3
              style={{
                fontSize: "11px",
                fontWeight: 700,
                marginBottom: "24px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: colors.text,
              }}
            >
              <span
                style={{
                  width: "4px",
                  height: "16px",
                  backgroundColor: colors.text,
                  borderRadius: "2px",
                }}
              />
              {editingMode ? "Edit Mode" : "Create New Mode"}
            </h3>
            <form onSubmit={handleCreateMode}>
              <div style={{ marginBottom: "20px" }}>
                <label
                  htmlFor="mode-name"
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "12px",
                    color: colors.text,
                    letterSpacing: "0.02em",
                  }}
                >
                  Mode Name
                </label>
                <input
                  type="text"
                  id="mode-name"
                  value={modeName}
                  onChange={(e) => setModeName(e.target.value)}
                  placeholder="Enter mode name"
                  required
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: `2px solid ${colors.inputBorder}`,
                    borderRadius: "8px",
                    fontSize: "14px",
                    backgroundColor: colors.bg,
                    color: colors.text,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  htmlFor="website-input"
                  style={{
                    display: "block",
                    fontSize: "12px",
                    fontWeight: 600,
                    marginBottom: "12px",
                    color: colors.text,
                    letterSpacing: "0.02em",
                  }}
                >
                  Add Website
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    id="website-input"
                    value={websiteInput}
                    onChange={(e) => setWebsiteInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddWebsite();
                      }
                    }}
                    placeholder="Enter website url"
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      border: `2px solid ${colors.inputBorder}`,
                      borderRadius: "8px",
                      fontSize: "14px",
                      backgroundColor: colors.bg,
                      color: colors.text,
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    style={{
                      padding: "12px 20px",
                      border: `2px solid ${colors.text}`,
                      borderRadius: "8px",
                      backgroundColor: "transparent",
                      color: colors.text,
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    onClick={handleAddWebsite}
                  >
                    Add
                  </button>
                </div>
                <small
                  style={{
                    display: "block",
                    marginTop: "8px",
                    fontSize: "11px",
                    color: colors.textMuted,
                  }}
                >
                  Enter one website at a time (e.g., youtube.com)
                </small>
              </div>

              {websites.length > 0 && (
                <div
                  style={{
                    marginBottom: "24px",
                    padding: "16px",
                    backgroundColor: colors.cardBg,
                    borderRadius: "12px",
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 600,
                      marginBottom: "12px",
                      color: colors.text,
                    }}
                  >
                    Websites in this mode ({websites.length})
                  </label>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {websites.map((website, index) => (
                      <li
                        key={index}
                        style={{
                          fontSize: "14px",
                          color: colors.text,
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "8px 0",
                        }}
                      >
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            backgroundColor: colors.text,
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ flex: 1, fontWeight: 500 }}>
                          {website}
                        </span>
                        <button
                          type="button"
                          style={{
                            background: "transparent",
                            border: "none",
                            color: colors.textMuted,
                            fontSize: "18px",
                            cursor: "pointer",
                            padding: "4px",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                          }}
                          onClick={() => handleRemoveWebsite(website)}
                          title="Remove website"
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                {editingMode && (
                  <button
                    type="button"
                    style={{
                      flex: 1,
                      padding: "12px 20px",
                      border: `2px solid ${colors.border}`,
                      borderRadius: "8px",
                      backgroundColor: "transparent",
                      color: colors.text,
                      fontWeight: 600,
                      fontSize: "13px",
                      cursor: "pointer",
                    }}
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    padding: "12px 20px",
                    border: `2px solid ${colors.text}`,
                    borderRadius: "8px",
                    backgroundColor:
                      isLoading || websites.length === 0
                        ? colors.cardBg
                        : "transparent",
                    color:
                      isLoading || websites.length === 0
                        ? colors.textMuted
                        : colors.text,
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor:
                      isLoading || websites.length === 0
                        ? "not-allowed"
                        : "pointer",
                    opacity: isLoading || websites.length === 0 ? 0.6 : 1,
                  }}
                  disabled={isLoading || websites.length === 0}
                >
                  {isLoading
                    ? "Saving..."
                    : editingMode
                    ? "Update Mode"
                    : "Create Mode"}
                </button>
              </div>
            </form>
          </section>

          <section
            style={{
              padding: "24px",
              backgroundColor: colors.bg,
            }}
          >
            <h3
              style={{
                fontSize: "11px",
                fontWeight: 700,
                marginBottom: "20px",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: colors.text,
              }}
            >
              <span
                style={{
                  width: "4px",
                  height: "16px",
                  backgroundColor: colors.text,
                  borderRadius: "2px",
                }}
              />
              Your Modes ({modes.length})
            </h3>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {modes.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div
                    style={{
                      width: "80px",
                      height: "80px",
                      margin: "0 auto 20px",
                      borderRadius: "16px",
                      backgroundColor: colors.cardBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <span style={{ fontSize: "28px" }}>📝</span>
                  </div>
                  <p
                    style={{
                      color: colors.textMuted,
                      fontSize: "14px",
                      fontWeight: 500,
                    }}
                  >
                    No modes yet. Create one above to get started!
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {modes.map((mode) => (
                    <div
                      key={mode.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "20px",
                        borderRadius: "12px",
                        border: `2px solid ${colors.border}`,
                        backgroundColor: colors.bg,
                      }}
                    >
                      <div
                        style={{ flex: 1, minWidth: 0, paddingRight: "16px" }}
                      >
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: "14px",
                            color: colors.text,
                          }}
                        >
                          {mode.name}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: colors.textMuted,
                            fontWeight: 500,
                            marginTop: "4px",
                          }}
                        >
                          {mode.websites.length} website
                          {mode.websites.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          flexShrink: 0,
                        }}
                      >
                        <button
                          style={{
                            backgroundColor: "transparent",
                            border: `2px solid ${colors.border}`,
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "11px",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            color: colors.text,
                            fontWeight: 600,
                            opacity: isLoading ? 0.5 : 1,
                          }}
                          onClick={() => handleEditMode(mode)}
                          disabled={isLoading}
                        >
                          Edit
                        </button>
                        <button
                          style={{
                            backgroundColor: "transparent",
                            border: `2px solid ${colors.border}`,
                            padding: "6px 12px",
                            borderRadius: "8px",
                            fontSize: "11px",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            color: colors.text,
                            fontWeight: 600,
                            opacity: isLoading ? 0.5 : 1,
                          }}
                          onClick={() => handleDeleteMode(mode.id)}
                          disabled={isLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      ) : currentView === "profile" ? (
        <section
          style={{
            padding: "24px",
            backgroundColor: colors.bg,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <p
              style={{
                color: colors.text,
                fontSize: "14px",
                fontWeight: 500,
                marginBottom: "24px",
              }}
            >
              {user?.email}
            </p>
            <button
              style={{
                padding: "12px 24px",
                border: `2px solid ${colors.text}`,
                borderRadius: "8px",
                backgroundColor: "transparent",
                color: colors.text,
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
              }}
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default Popup;
