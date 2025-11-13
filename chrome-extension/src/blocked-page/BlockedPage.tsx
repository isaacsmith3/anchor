import React, { useState, useEffect } from "react";

const BlockedPage: React.FC = () => {
  const [blockedSite, setBlockedSite] = useState<string>("");
  const [isUnblocking, setIsUnblocking] = useState(false);

  useEffect(() => {
    // Get the blocked site URL from query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const site = urlParams.get("site");
    if (site) {
      setBlockedSite(decodeURIComponent(site));
    }
  }, []);

  const handleUnblock = async () => {
    setIsUnblocking(true);

    try {
      const response = await chrome.runtime.sendMessage({
        type: "STOP_BLOCKING_SESSION",
      });

      if (response.success) {
        // Redirect to the blocked site
        if (blockedSite) {
          // Ensure we have a protocol
          let url = blockedSite;
          if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = `https://${url}`;
          }
          window.location.href = url;
        } else {
          window.history.back();
        }
      } else {
        alert("Failed to unblock. Please try again.");
        setIsUnblocking(false);
      }
    } catch (error) {
      console.error("Error unblocking:", error);
      alert("Error unblocking site. Please try again.");
      setIsUnblocking(false);
    }
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-white">
      <div className="w-full max-w-[600px]">
        <div className="bg-white rounded-lg p-12 shadow-[0_20px_60px_rgba(0,0,0,0.1)] text-center animate-[slideUp_0.4s_ease-out]">
          <div className="text-6xl mb-6">⚓️</div>
          <h1 className="text-3xl text-mono-black mb-3 font-semibold">
            Site Blocked
          </h1>
          <p className="text-lg text-mono-black font-semibold mb-4 break-words">
            {blockedSite || "This site is blocked by Anchor"}
          </p>
          <p className="text-base text-mono-gray-text leading-relaxed mb-8">
            This site is currently blocked by your active blocking mode. Click
            the button below to unblock and access the site.
          </p>

          <div className="flex flex-col gap-3 mb-6">
            <button
              className="w-full px-8 py-4 border border-mono-black rounded bg-mono-black text-white text-base font-semibold cursor-pointer transition-all hover:bg-mono-dark hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.15)] active:translate-y-0 disabled:bg-mono-gray-input disabled:text-mono-gray-muted disabled:border-mono-gray-input disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              onClick={handleUnblock}
              disabled={isUnblocking}
            >
              {isUnblocking ? "Unblocking..." : "Unblock Site"}
            </button>
            <button
              className="w-full px-8 py-4 border border-mono-gray-input rounded bg-mono-gray-light text-mono-gray-text text-base font-semibold cursor-pointer transition-all hover:bg-mono-gray-border"
              onClick={handleGoBack}
            >
              ← Go Back
            </button>
          </div>

          <div className="border-t border-mono-gray-border pt-6 text-[13px] text-mono-gray-muted">
            <p className="mb-1">Need to manage your blocked sites?</p>
            <p>Click the Anchor extension icon in your toolbar</p>
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
