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

    // Set dark mode background
    document.body.style.backgroundColor = "#000000";
    document.documentElement.style.backgroundColor = "#000000";

    return () => {
      // Cleanup on unmount
      document.body.style.backgroundColor = "";
      document.documentElement.style.backgroundColor = "";
    };
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
    <div className="min-h-screen flex items-center justify-center p-5 bg-black">
      <div className="w-full max-w-[600px]">
        <div className="bg-gray-900 rounded-lg p-12 border border-gray-700 text-center animate-[slideUp_0.4s_ease-out] shadow-lg">
          <div className="text-6xl mb-6">⚓️</div>
          <h1 className="text-3xl text-white mb-3 font-semibold">
            Site Blocked
          </h1>
          <p className="text-lg text-white font-semibold mb-4 break-words">
            {blockedSite || "This site is blocked by Anchor"}
          </p>
          <p className="text-base text-gray-400 leading-relaxed mb-8">
            This site is currently blocked by your active blocking mode.
          </p>

          <div className="flex flex-col gap-3 mb-6">
            <button
              className="w-full px-8 py-4 border-2 border-gray-700 rounded-lg bg-gray-900 text-gray-300 text-base font-semibold cursor-pointer transition-all hover:bg-gray-800 hover:border-gray-600 hover:text-white"
              onClick={handleGoBack}
            >
              ← Go Back
            </button>
          </div>

          <div className="border-t border-gray-700 pt-6 text-[13px] text-gray-400">
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
