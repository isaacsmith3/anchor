"use client";

import { useEffect } from "react";

interface DemoStateChangeEvent extends CustomEvent {
  detail: { active: boolean };
}

export function DemoThemeSync() {
  useEffect(() => {
    // Check if demo is active on mount
    const checkDemoState = () => {
      const demoActive = localStorage.getItem("anchor_demo_active") === "true";
      if (demoActive) {
        document.documentElement.classList.add("dark");
      }
    };

    checkDemoState();

    // Listen for storage changes (in case demo state changes in another tab or component)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "anchor_demo_active") {
        if (e.newValue === "true") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    // Also listen for custom events within the same page
    const handleDemoChange = (e: Event) => {
      const customEvent = e as DemoStateChangeEvent;
      if (customEvent.detail.active) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("demoStateChange", handleDemoChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("demoStateChange", handleDemoChange);
    };
  }, []);

  return null;
}
