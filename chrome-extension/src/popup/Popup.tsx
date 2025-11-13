import React, { useState, useEffect } from "react";

interface Mode {
  id: string;
  name: string;
  websites: string[];
  created_at: string;
}

type View = "blocking" | "modes";

const Popup: React.FC = () => {
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

  useEffect(() => {
    loadModes();
    loadActiveMode();
  }, []);

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
    document.body.style.backgroundColor = isDarkMode ? "#000000" : "#ffffff";
    document.documentElement.style.backgroundColor = isDarkMode
      ? "#000000"
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

  const isDarkMode = !!activeMode;

  return (
    <div
      className={`flex flex-col w-full min-w-[400px] min-h-full antialiased transition-colors duration-300 ${
        isDarkMode
          ? "bg-black text-white"
          : "bg-gradient-to-b from-gray-50 to-white text-mono-black"
      }`}
    >
      <header
        className={`px-6 py-7 text-center border-b shadow-sm transition-colors duration-300 ${
          isDarkMode
            ? "bg-black border-gray-700 text-white"
            : "bg-gradient-to-br from-mono-dark via-mono-black to-mono-dark border-mono-black text-black"
        }`}
      >
        <div className="text-2xl mb-1">⚓</div>
        <h1 className="text-xl font-semibold mb-0.5 tracking-tight">
          Anchor Blocker
        </h1>
      </header>

      {/* Tab Navigation */}
      <div
        className={`flex border-b transition-colors duration-300 ${
          isDarkMode
            ? "border-gray-700 bg-black"
            : "border-mono-gray-border bg-white"
        }`}
      >
        <button
          className={`flex-1 px-5 py-3.5 text-xs font-medium tracking-wider uppercase transition-all relative ${
            currentView === "blocking"
              ? isDarkMode
                ? "bg-black text-white border-b-2 border-accent-blue"
                : "bg-white text-mono-black border-b-2 border-accent-blue"
              : isDarkMode
              ? "bg-black text-gray-400 hover:bg-gray-900 hover:text-white"
              : "bg-gray-50 text-mono-gray-text hover:bg-white hover:text-mono-black"
          }`}
          onClick={() => setCurrentView("blocking")}
        >
          Blocking
        </button>
        <button
          className={`flex-1 px-5 py-3.5 text-xs font-medium tracking-wider uppercase transition-all relative ${
            currentView === "modes"
              ? isDarkMode
                ? "bg-black text-white border-b-2 border-accent-purple"
                : "bg-white text-mono-black border-b-2 border-accent-purple"
              : activeMode
              ? isDarkMode
                ? "bg-black text-gray-600 cursor-not-allowed opacity-60"
                : "bg-gray-50 text-mono-gray-muted cursor-not-allowed opacity-60"
              : isDarkMode
              ? "bg-black text-gray-400 hover:bg-gray-900 hover:text-white"
              : "bg-gray-50 text-mono-gray-text hover:bg-white hover:text-mono-black"
          }`}
          onClick={() => {
            if (!activeMode) {
              setCurrentView("modes");
            } else {
              alert(
                `Cannot access modes page while a blocking session is active. Please stop the session with "${activeMode.name}" first.`
              );
            }
          }}
          disabled={!!activeMode}
          title={
            activeMode
              ? `Stop "${activeMode.name}" session to manage modes`
              : undefined
          }
        >
          Modes
        </button>
      </div>

      {/* Content based on current view */}
      {currentView === "blocking" ? (
        <>
          <section
            className={`px-6 py-6 border-b transition-colors duration-300 ${
              isDarkMode
                ? "border-gray-700 bg-black"
                : "border-mono-gray-border bg-white"
            }`}
          >
            <h3
              className={`text-[11px] font-bold mb-4 tracking-wider uppercase flex items-center gap-2 ${
                isDarkMode ? "text-white" : "text-mono-black"
              }`}
            >
              <span className="w-1 h-4 bg-accent-blue rounded-full"></span>
              Select Blocking Session
            </h3>
            {modes.length === 0 ? (
              <div className="text-center py-8">
                <div
                  className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center border transition-colors duration-300 ${
                    isDarkMode
                      ? "from-gray-800 to-gray-900 border-gray-700"
                      : "from-accent-purpleLight to-white border-accent-purpleLight"
                  }`}
                >
                  <span className="text-3xl">📋</span>
                </div>
                <p
                  className={`text-sm mb-5 font-medium ${
                    isDarkMode ? "text-gray-400" : "text-mono-gray-muted"
                  }`}
                >
                  No modes available
                </p>
                <button
                  className={`px-5 py-2.5 border-2 border-accent-purple rounded-lg font-semibold text-xs transition-all hover:shadow-md hover:-translate-y-0.5 ${
                    isDarkMode
                      ? "bg-black text-accent-purple hover:bg-accent-purple hover:text-white"
                      : "bg-white text-accent-purple hover:bg-accent-purple hover:text-white"
                  }`}
                  onClick={() => setCurrentView("modes")}
                >
                  Create Your First Mode
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {modes.map((mode) => {
                  const isDisabled =
                    activeMode !== null && activeMode.id !== mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => {
                        if (!isDisabled) {
                          setSelectedModeId(mode.id);
                        }
                      }}
                      disabled={isDisabled}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        selectedModeId === mode.id
                          ? activeMode?.id === mode.id
                            ? isDarkMode
                              ? "border-accent-green bg-gray-800 shadow-md"
                              : "border-accent-green bg-accent-greenLight shadow-md"
                            : isDarkMode
                            ? "border-accent-blue bg-gray-800 shadow-md"
                            : "border-accent-blue bg-accent-blueLight shadow-md"
                          : isDisabled
                          ? isDarkMode
                            ? "border-gray-800 bg-gray-900 opacity-50 cursor-not-allowed"
                            : "border-mono-gray-border bg-white opacity-50 cursor-not-allowed"
                          : isDarkMode
                          ? "border-gray-700 bg-gray-900 hover:border-accent-blue hover:shadow-sm"
                          : "border-mono-gray-border bg-white hover:border-accent-blue hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div
                            className={`font-bold text-sm mb-1 tracking-tight flex items-center gap-2 ${
                              isDarkMode ? "text-white" : "text-mono-black"
                            }`}
                          >
                            {mode.name}
                          </div>
                          <div
                            className={`text-[11px] font-medium ${
                              isDarkMode
                                ? "text-gray-400"
                                : "text-mono-gray-text"
                            }`}
                          >
                            {mode.websites.length} website
                            {mode.websites.length !== 1 ? "s" : ""}
                          </div>
                        </div>
                        {selectedModeId === mode.id && (
                          <span
                            className={`text-lg ${
                              isDarkMode
                                ? "text-accent-blue"
                                : "text-accent-blue"
                            }`}
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
              className={`px-6 py-6 border-b last:border-b-0 transition-colors duration-300 ${
                isDarkMode
                  ? "border-gray-700 bg-black"
                  : "border-mono-gray-border bg-white"
              }`}
            >
              <button
                className={`w-full px-5 py-4 rounded-lg font-semibold text-[14px] tracking-wide border-2 transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                  activeMode && activeMode.id === selectedModeId
                    ? isDarkMode
                      ? "border-accent-red bg-gray-900 text-accent-red hover:bg-accent-red hover:text-white"
                      : "border-accent-red bg-white text-accent-red hover:bg-accent-red hover:text-mono-black"
                    : isDarkMode
                    ? "border-accent-green bg-gray-900 text-accent-green hover:bg-accent-green hover:text-white"
                    : "border-accent-green bg-white text-accent-green hover:bg-accent-green hover:text-mono-black"
                } disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none`}
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
                  className={`text-xs text-center mt-3 ${
                    isDarkMode ? "text-gray-400" : "text-mono-gray-muted"
                  }`}
                >
                  Currently blocking {activeMode.websites.length} website
                  {activeMode.websites.length !== 1 ? "s" : ""}
                </p>
              )}
            </section>
          )}
        </>
      ) : (
        <>
          <section className="px-6 py-6 border-b border-mono-gray-border bg-white">
            <h3 className="text-[11px] font-bold mb-6 tracking-wider uppercase text-mono-black flex items-center gap-2">
              <span className="w-1 h-4 bg-accent-purple rounded-full"></span>
              {editingMode ? "Edit Mode" : "Create New Mode"}
            </h3>
            <form onSubmit={handleCreateMode}>
              <div className="mb-5">
                <label
                  htmlFor="mode-name"
                  className="block text-xs font-semibold mb-3 text-mono-black tracking-wide"
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
                  className="w-full px-4 py-3 border-2 border-mono-gray-input rounded-lg text-sm bg-white text-mono-black transition-all focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purpleLight placeholder:text-mono-gray-muted"
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="website-input"
                  className="block text-xs font-semibold mb-3 text-mono-black tracking-wide"
                >
                  Add Website
                </label>
                <div className="flex gap-2">
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
                    className="flex-1 px-4 py-3 border-2 border-mono-gray-input rounded-lg text-sm bg-white text-mono-black transition-all focus:outline-none focus:border-accent-purple focus:ring-2 focus:ring-accent-purpleLight placeholder:text-mono-gray-muted"
                  />
                  <button
                    type="button"
                    className="px-5 py-3 border-2 border-accent-purple rounded-lg bg-white text-accent-purple font-semibold text-[13px] tracking-wide transition-all hover:bg-accent-purple hover:text-mono-black hover:shadow-md hover:-translate-y-0.5 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleAddWebsite}
                  >
                    Add
                  </button>
                </div>
                <small className="block mt-2 text-[11px] text-mono-gray-muted leading-relaxed">
                  Enter one website at a time (e.g., youtube.com)
                </small>
              </div>

              {websites.length > 0 && (
                <div className="mb-6 p-4 bg-gradient-to-br from-accent-purpleLight to-white rounded-xl border border-accent-purpleLight">
                  <label className="block text-xs font-semibold mb-3 text-mono-black tracking-wide">
                    Websites in this mode ({websites.length})
                  </label>
                  <ul className="space-y-2">
                    {websites.map((website, index) => (
                      <li
                        key={index}
                        className="text-sm text-mono-black flex items-center gap-3 group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-purple shrink-0"></span>
                        <span className="flex-1 font-medium">{website}</span>
                        <button
                          type="button"
                          className="bg-transparent border-none text-mono-gray-text text-lg cursor-pointer p-1 w-6 h-6 flex items-center justify-center rounded-full transition-all hover:bg-accent-redLight hover:text-accent-red font-light shrink-0 opacity-0 group-hover:opacity-100"
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

              <div className="flex gap-3 mt-6">
                {editingMode && (
                  <button
                    type="button"
                    className="flex-1 px-5 py-3 border-2 border-mono-gray-input rounded-lg bg-white text-mono-black font-semibold text-[13px] tracking-wide transition-all hover:bg-mono-gray-light hover:border-mono-black hover:shadow-sm"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 px-5 py-3 border-2 border-accent-purple rounded-lg bg-white text-accent-purple font-semibold text-[13px] tracking-wide transition-all hover:bg-accent-purple hover:text-mono-black hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 disabled:bg-mono-gray-light disabled:text-mono-gray-text disabled:border-mono-gray-input disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
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

          <section className="px-6 py-6 border-b border-mono-gray-border last:border-b-0 bg-white">
            <h3 className="text-[11px] font-bold mb-5 tracking-wider uppercase text-mono-black flex items-center gap-2">
              <span className="w-1 h-4 bg-accent-purple rounded-full"></span>
              Your Modes ({modes.length})
            </h3>
            <div className="max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-mono-gray-input [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-mono-gray-muted">
              {modes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-accent-purpleLight to-white flex items-center justify-center border border-accent-purpleLight">
                    <span className="text-3xl">📝</span>
                  </div>
                  <p className="text-mono-gray-muted text-sm font-medium">
                    No modes yet. Create one above to get started!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {modes.map((mode) => (
                    <div
                      key={mode.id}
                      className="flex justify-between items-center p-5 rounded-xl border-2 border-mono-gray-border bg-white hover:border-accent-purple hover:shadow-md transition-all"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="font-bold text-sm tracking-tight text-mono-black">
                          {mode.name}
                        </div>
                        <div className="text-[11px] text-mono-gray-text font-medium mt-1">
                          {mode.websites.length} website
                          {mode.websites.length !== 1 ? "s" : ""}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          className="bg-white border-2 border-accent-blue px-3 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all text-accent-blue font-semibold tracking-wide hover:-translate-y-0.5 hover:text-mono-black hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-mono-gray-light disabled:border-mono-gray-input disabled:text-mono-gray-text disabled:hover:bg-mono-gray-light disabled:hover:text-mono-gray-text whitespace-nowrap"
                          onClick={() => handleEditMode(mode)}
                          disabled={isLoading}
                        >
                          Edit
                        </button>
                        <button
                          className="bg-white border-2 border-accent-red px-3 py-1.5 rounded-lg text-[11px] cursor-pointer transition-all text-accent-red font-semibold tracking-wide hover:-translate-y-0.5 hover:text-mono-black hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-mono-gray-light disabled:border-mono-gray-input disabled:text-mono-gray-text disabled:hover:bg-mono-gray-light disabled:hover:text-mono-gray-text whitespace-nowrap"
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
      )}
    </div>
  );
};

export default Popup;
