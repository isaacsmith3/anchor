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

  const handleStartBlocking = async (modeId: string) => {
    setIsLoading(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: "START_BLOCKING_SESSION",
        modeId: modeId,
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

  return (
    <div className="flex flex-col w-full min-w-[400px] h-full bg-white text-mono-black antialiased">
      <header className="bg-mono-dark text-black px-5 py-6 text-center border-b border-mono-black">
        <h1 className="text-xl font-semibold mb-1.5 tracking-tight">
          Anchor Blocker
        </h1>
      </header>

      {/* Tab Navigation */}
      <div className="flex border-b border-mono-gray-border">
        <button
          className={`flex-1 px-4 py-3 text-xs font-medium tracking-wider uppercase transition-all ${
            currentView === "blocking"
              ? "bg-mono-black text-black border-b-2 border-mono-black"
              : "bg-white text-mono-gray-text hover:bg-mono-gray-light"
          }`}
          onClick={() => setCurrentView("blocking")}
        >
          Blocking
        </button>
        <button
          className={`flex-1 px-4 py-3 text-xs font-medium tracking-wider uppercase transition-all ${
            currentView === "modes"
              ? "bg-mono-black text-black border-b-2 border-mono-black"
              : "bg-white text-mono-gray-text hover:bg-mono-gray-light"
          }`}
          onClick={() => setCurrentView("modes")}
        >
          Modes
        </button>
      </div>

      {/* Content based on current view */}
      {currentView === "blocking" ? (
        <>
          {activeMode ? (
            <section className="bg-mono-dark text-black px-5 py-5 border-b border-mono-black">
              <h3 className="text-[11px] font-semibold mb-4 tracking-wider uppercase opacity-80">
                Active Blocking Session
              </h3>
              <div className="mb-4">
                <div className="text-lg font-semibold mb-1.5 tracking-tight">
                  {activeMode.name}
                </div>
                <div className="text-xs opacity-70 font-normal">
                  Blocking {activeMode.websites.length} website(s)
                </div>
              </div>
              <button
                className="w-full px-5 py-3 border border-white rounded bg-white text-mono-black font-medium text-[13px] tracking-wide transition-all hover:bg-gray-100 hover:border-gray-100 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                onClick={handleStopBlocking}
                disabled={isLoading}
              >
                {isLoading ? "Stopping..." : "Stop Blocking"}
              </button>
            </section>
          ) : (
            <section className="px-5 py-8 border-b border-mono-gray-border">
              <p className="text-center text-mono-gray-muted text-sm mb-6">
                No active blocking session
              </p>
            </section>
          )}

          <section className="px-5 py-5 border-b border-mono-gray-border last:border-b-0">
            <h3 className="text-[11px] font-semibold mb-4 tracking-wider uppercase text-mono-black">
              Select Mode to Block
            </h3>
            <div className="max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-mono-gray-input [&::-webkit-scrollbar-thumb]:rounded-sm hover:[&::-webkit-scrollbar-thumb]:bg-mono-gray-muted">
              {modes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-mono-gray-muted text-[13px] mb-4">
                    No modes available
                  </p>
                  <button
                    className="px-4 py-2 border border-mono-black rounded bg-mono-black text-black font-medium text-xs transition-all hover:bg-mono-dark hover:border-mono-dark hover:-translate-y-px hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)]"
                    onClick={() => setCurrentView("modes")}
                  >
                    Create Your First Mode
                  </button>
                </div>
              ) : (
                modes.map((mode) => (
                  <div
                    key={mode.id}
                    className={`flex justify-between items-start p-4 mb-2 last:mb-0 bg-white rounded border transition-all ${
                      activeMode?.id === mode.id
                        ? "border-mono-black bg-[#fafafa] shadow-[0_1px_3px_rgba(0,0,0,0.08)] hover:border-mono-black hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                        : "border-mono-gray-border hover:border-mono-gray-input hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)]"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-mono-black mb-1.5 tracking-tight">
                        {mode.name}
                      </div>
                      <div className="text-[11px] text-mono-gray-muted mb-2 leading-snug">
                        {mode.websites.length} website(s)
                      </div>
                      {mode.websites.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {mode.websites.slice(0, 3).map((website, idx) => (
                            <span
                              key={idx}
                              className="inline-block bg-mono-gray-light px-2 py-1 rounded-sm text-[10px] text-mono-gray-text border border-mono-gray-border font-normal"
                            >
                              {website}
                            </span>
                          ))}
                          {mode.websites.length > 3 && (
                            <span className="inline-block bg-mono-gray-light px-2 py-1 rounded-sm text-[10px] text-mono-gray-text border border-mono-gray-border font-normal">
                              +{mode.websites.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {activeMode?.id === mode.id ? (
                        <span className="bg-mono-black text-black px-3 py-1.5 rounded text-[11px] font-medium tracking-wider uppercase">
                          Active
                        </span>
                      ) : (
                        <button
                          className="px-4 py-2 border border-mono-black rounded bg-mono-black text-black font-medium text-xs transition-all hover:bg-mono-dark hover:border-mono-dark hover:-translate-y-px hover:shadow-[0_2px_6px_rgba(0,0,0,0.12)] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                          onClick={() => handleStartBlocking(mode.id)}
                          disabled={isLoading}
                        >
                          Start Blocking
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="px-5 py-5 border-b border-mono-gray-border">
            <h3 className="text-[11px] font-semibold mb-4 tracking-wider uppercase text-mono-black">
              {editingMode ? "Edit Mode" : "Create New Mode"}
            </h3>
            <form onSubmit={handleCreateMode}>
              <div className="mb-4">
                <label
                  htmlFor="mode-name"
                  className="block text-xs font-medium mb-2 text-mono-gray-text tracking-wide"
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
                  className="w-full px-3 py-2.5 border border-mono-gray-input rounded text-sm bg-white text-mono-black transition-all focus:outline-none focus:border-mono-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] placeholder:text-mono-gray-muted"
                />
              </div>

              <div className="mb-4">
                <label
                  htmlFor="website-input"
                  className="block text-xs font-medium mb-2 text-mono-gray-text tracking-wide"
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
                    className="flex-1 px-3 py-2.5 border border-mono-gray-input rounded text-sm bg-white text-mono-black transition-all focus:outline-none focus:border-mono-black focus:shadow-[0_0_0_3px_rgba(0,0,0,0.05)] placeholder:text-mono-gray-muted"
                  />
                  <button
                    type="button"
                    className="px-5 py-2.5 border border-mono-gray-input rounded bg-white text-mono-black font-medium text-[13px] tracking-wide transition-all hover:bg-mono-gray-light hover:border-mono-black"
                    onClick={handleAddWebsite}
                  >
                    Add
                  </button>
                </div>
                <small className="block mt-1.5 text-[11px] text-mono-gray-muted leading-snug">
                  Enter one website at a time (e.g., youtube.com)
                </small>
              </div>

              {websites.length > 0 && (
                <div className="mb-4">
                  <label className="block text-xs font-medium mb-2 text-mono-gray-text tracking-wide">
                    Websites in this mode ({websites.length})
                  </label>
                  <ul className="list-disc list-inside mt-2.5 space-y-1">
                    {websites.map((website, index) => (
                      <li
                        key={index}
                        className="text-sm text-mono-black flex items-center gap-2"
                      >
                        <span className="flex-1">{website}</span>
                        <button
                          type="button"
                          className="bg-transparent border-none text-mono-gray-text text-base cursor-pointer p-0 w-[18px] h-[18px] flex items-center justify-center rounded-full transition-all hover:bg-mono-gray-border hover:text-mono-black font-light shrink-0"
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

              <div className="flex gap-2 mt-5">
                {editingMode && (
                  <button
                    type="button"
                    className="flex-1 px-5 py-3 border border-mono-gray-input rounded bg-white text-mono-black font-medium text-[13px] tracking-wide transition-all hover:bg-mono-gray-light hover:border-mono-black"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  className="flex-1 px-5 py-3 border border-mono-black rounded bg-mono-black text-black font-medium text-[13px] tracking-wide transition-all hover:bg-mono-dark hover:border-mono-dark hover:-translate-y-px hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)] active:translate-y-0 active:shadow-[0_1px_4px_rgba(0,0,0,0.1)] disabled:bg-mono-gray-border disabled:text-mono-gray-muted disabled:border-mono-gray-border disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
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

          <section className="px-5 py-5 border-b border-mono-gray-border last:border-b-0">
            <h3 className="text-[11px] font-semibold mb-4 tracking-wider uppercase text-mono-black">
              Your Modes (<span>{modes.length}</span>)
            </h3>
            <div className="max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-mono-gray-input [&::-webkit-scrollbar-thumb]:rounded-sm hover:[&::-webkit-scrollbar-thumb]:bg-mono-gray-muted">
              {modes.length === 0 ? (
                <p className="text-center text-mono-gray-muted py-8 px-5 text-[13px] leading-relaxed">
                  No modes yet. Create one above to get started!
                </p>
              ) : (
                modes.map((mode) => (
                  <div
                    key={mode.id}
                    className={`flex justify-between items-center p-4 mb-2 last:mb-0 bg-white rounded border transition-all ${
                      activeMode?.id === mode.id
                        ? "border-mono-black bg-[#fafafa] shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
                        : "border-mono-gray-border hover:border-mono-gray-input hover:shadow-[0_2px_6px_rgba(0,0,0,0.06)]"
                    }`}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="font-semibold text-sm text-mono-black tracking-tight">
                        {mode.name}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {activeMode?.id === mode.id && (
                        <span className="bg-mono-black text-black px-2 py-1 rounded text-[10px] font-medium tracking-wider uppercase">
                          Active
                        </span>
                      )}
                      <button
                        className="bg-transparent border border-mono-gray-border px-3 py-1.5 rounded text-[11px] cursor-pointer transition-all text-mono-black font-medium tracking-wide hover:bg-mono-gray-light hover:border-mono-gray-input hover:text-mono-dark disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        onClick={() => handleEditMode(mode)}
                        disabled={isLoading}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-transparent border border-mono-gray-border px-3 py-1.5 rounded text-[11px] cursor-pointer transition-all text-mono-gray-text font-medium tracking-wide hover:bg-mono-gray-light hover:border-mono-gray-input hover:text-mono-black disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        onClick={() => handleDeleteMode(mode.id)}
                        disabled={isLoading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}

      {/* <footer className="text-center px-5 py-4 text-mono-gray-muted text-[10px] bg-[#fafafa] border-t border-mono-gray-border tracking-wide">
        {currentView === "blocking"
          ? 'Click "Stop Blocking" to unblock all sites'
          : "Manage your blocking modes here"}
      </footer> */}
    </div>
  );
};

export default Popup;
