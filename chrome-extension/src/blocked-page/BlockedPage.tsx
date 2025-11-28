import React, { useState, useEffect } from "react";

const BlockedPage: React.FC = () => {
  const [blockedSite, setBlockedSite] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);

  // Color definitions (dark mode only for blocked page)
  const colors = {
    bg: "#0f0f0f",
    text: "#ffffff",
    textMuted: "#737373",
    border: "#262626",
    cardBg: "#171717",
  };

  useEffect(() => {
    // Get the blocked site URL from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const site = urlParams.get("site");
    if (site) {
      setBlockedSite(decodeURIComponent(site));
    }

    // Set dark mode background
    document.body.style.backgroundColor = colors.bg;
    document.documentElement.style.backgroundColor = colors.bg;

    const checkBlockingStatus = async () => {
      try {
        const response = await chrome.runtime.sendMessage({
          type: "GET_ACTIVE_MODE",
        });

        if (response.success && !response.data) {
          const siteToVisit = site || blockedSite;
          if (siteToVisit) {
            window.location.href = siteToVisit;
          }
        }
      } catch (error) {
        console.error("Error checking blocking status:", error);
        window.history.back();
      }
    };

    checkBlockingStatus();

    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName !== "local") return;

      if (
        changes.active_mode &&
        (changes.active_mode.newValue === null ||
          changes.active_mode.newValue.is_active === false)
      ) {
        checkBlockingStatus();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    const pollInterval = setInterval(() => {
      checkBlockingStatus();
    }, 5000);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
      clearInterval(pollInterval);
      document.body.style.backgroundColor = "";
      document.documentElement.style.backgroundColor = "";
    };
  }, [blockedSite]);

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backgroundColor: colors.bg,
      }}
    >
      <div style={{ width: "100%", maxWidth: "600px" }}>
        <div
          style={{
            backgroundColor: colors.cardBg,
            borderRadius: "12px",
            padding: "48px",
            border: `1px solid ${colors.border}`,
            textAlign: "center",
            animation: "slideUp 0.4s ease-out",
          }}
        >
          <img
            src={chrome.runtime.getURL("anchor-icon128.png")}
            alt="Anchor"
            style={{
              width: "64px",
              height: "64px",
              marginBottom: "24px",
              opacity: 0.9,
              display: "block",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          />
          <h1
            style={{
              fontSize: "28px",
              color: colors.text,
              marginBottom: "12px",
              fontWeight: 600,
            }}
          >
            Site Blocked
          </h1>
          <p
            style={{
              fontSize: "16px",
              color: colors.textMuted,
              lineHeight: 1.6,
              marginBottom: "32px",
            }}
          >
            Stay anchored to what matters.
            {isChecking && (
              <span style={{ display: "block", marginTop: "8px" }}>
                Checking blocking status...
              </span>
            )}
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              marginBottom: "24px",
            }}
          >
            <button
              style={{
                width: "100%",
                padding: "16px 32px",
                border: `2px solid ${colors.border}`,
                borderRadius: "8px",
                backgroundColor: "transparent",
                color: colors.textMuted,
                fontSize: "16px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onClick={handleGoBack}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = colors.text;
                e.currentTarget.style.color = colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = colors.border;
                e.currentTarget.style.color = colors.textMuted;
              }}
            >
              ← Go Back
            </button>
          </div>

          <div
            style={{
              borderTop: `1px solid ${colors.border}`,
              paddingTop: "24px",
              fontSize: "13px",
              color: colors.textMuted,
            }}
          >
            <p style={{ marginBottom: "4px" }}>
              Need to manage your blocked sites?
            </p>
            <p>Open the Anchor mobile app.</p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default BlockedPage;
