"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ScrollReveal } from "./scroll-reveal";

const DISTRACTING_SITES = [
  "twitter.com",
  "reddit.com",
  "youtube.com",
  "instagram.com",
  "tiktok.com",
];

export function Demo() {
  const [isActive, setIsActive] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [blockedSite, setBlockedSite] = useState<string | null>(null);

  // Check localStorage on mount for persisted demo state
  useEffect(() => {
    const savedState = localStorage.getItem("anchor_demo_active");
    if (savedState === "true") {
      setIsActive(true);
    }
  }, []);

  useEffect(() => {
    if (isActive) {
      const randomSite =
        DISTRACTING_SITES[Math.floor(Math.random() * DISTRACTING_SITES.length)];
      setBlockedSite(randomSite);
      document.documentElement.classList.add("dark");
      // Persist to localStorage
      localStorage.setItem("anchor_demo_active", "true");
      // Dispatch custom event for same-page listeners
      window.dispatchEvent(
        new CustomEvent("demoStateChange", { detail: { active: true } })
      );
    } else {
      setBlockedSite(null);
      document.documentElement.classList.remove("dark");
      // Clear from localStorage
      localStorage.removeItem("anchor_demo_active");
      // Dispatch custom event for same-page listeners
      window.dispatchEvent(
        new CustomEvent("demoStateChange", { detail: { active: false } })
      );
    }
  }, [isActive]);

  const handleActivate = () => {
    setIsActive(true);
  };

  const handleDeactivate = () => {
    setIsActive(false);
    setShowPopup(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Demo Header */}
      <div className="text-center mb-12">
        <h2 className="text-2xl lg:text-3xl font-bold mb-3">
          Starts on the browser,
          <br className="hidden lg:block" /> stops on the phone.
        </h2>
      </div>

      {/* Demo Container - Browser and Phone side by side on large screens */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-start justify-center">
        {/* Browser Demo */}
        <div className="relative flex-1 max-w-2xl w-full">
          <div className="text-center mb-4">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Step 1: Browser Extension
            </span>
          </div>

          {/* Mock Browser Window */}
          <div
            className={`rounded-2xl border-2 overflow-hidden transition-all duration-500 ${
              isActive
                ? "border-white/20 bg-[#0f0f0f]"
                : "border-border bg-card"
            }`}
          >
            {/* Mock Browser Chrome */}
            <div
              className={`flex items-center gap-2 px-4 py-3 border-b transition-colors duration-500 ${
                isActive
                  ? "border-white/10 bg-[#171717]"
                  : "border-border bg-muted/30"
              }`}
            >
              <div className="flex gap-1.5">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isActive ? "bg-white/20" : "bg-red-400"
                  }`}
                />
                <div
                  className={`w-3 h-3 rounded-full ${
                    isActive ? "bg-white/20" : "bg-yellow-400"
                  }`}
                />
                <div
                  className={`w-3 h-3 rounded-full ${
                    isActive ? "bg-white/20" : "bg-green-400"
                  }`}
                />
              </div>
              <div
                className={`flex-1 mx-4 px-4 py-1.5 rounded-lg text-sm transition-colors duration-500 ${
                  isActive
                    ? "bg-white/5 text-white/60"
                    : "bg-background text-muted-foreground"
                }`}
              >
                {isActive ? blockedSite : "twitter.com"}
              </div>

              {/* Extension Icon Button */}
              <button
                onClick={() => setShowPopup(!showPopup)}
                className={`relative w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-105 ${
                  isActive
                    ? "bg-white/10 hover:bg-white/20"
                    : "bg-muted hover:bg-muted/80"
                } ${
                  showPopup ? "ring-2 ring-offset-2 ring-foreground/20" : ""
                }`}
                title="Click to open Anchor extension"
              >
                <Image
                  src="/images/anchor-icon48.png"
                  alt="Anchor"
                  width={28}
                  height={28}
                  className="rounded-lg"
                />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-[#171717]" />
                )}
              </button>
            </div>

            {/* Browser Content */}
            <div className="p-6 lg:p-8 min-h-[280px] flex items-center justify-center">
              {isActive ? (
                // Blocked State
                <div className="text-center animate-in fade-in duration-500">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-[#171717] border border-white/10 flex items-center justify-center">
                    <span className="text-2xl">⚓</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Site Blocked
                  </h3>
                  <p className="text-white/50 text-sm max-w-xs mx-auto">
                    Stay anchored to what matters.
                  </p>
                </div>
              ) : (
                // Mock Twitter/Social Feed
                <div className="w-full max-w-sm space-y-3 opacity-60">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 bg-muted rounded w-20" />
                      <div className="h-2.5 bg-muted rounded w-full" />
                      <div className="h-2.5 bg-muted rounded w-3/4" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-2.5 bg-muted rounded w-24" />
                      <div className="h-2.5 bg-muted rounded w-full" />
                    </div>
                  </div>
                  {!showPopup && (
                    <div className="text-center pt-2">
                      <p className="text-xs text-muted-foreground">
                        Click the anchor icon to start
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Extension Popup */}
            {showPopup && (
              <div
                className={`absolute top-14 right-4 w-56 rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 z-10 ${
                  isActive
                    ? "bg-[#0f0f0f] border border-white/20"
                    : "bg-background border-2 border-border"
                }`}
              >
                <div
                  className={`p-3 text-center rounded-t-xl ${
                    isActive ? "bg-[#0f0f0f]" : "bg-foreground"
                  }`}
                >
                  <span
                    className={`text-xs font-bold tracking-widest ${
                      isActive ? "text-white" : "text-background"
                    }`}
                  >
                    ANCHOR
                  </span>
                </div>
                <div className="p-3">
                  {isActive ? (
                    <div className="space-y-3">
                      <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <div>
                            <div className="text-xs font-semibold text-white">
                              Focus Mode
                            </div>
                            <div className="text-[10px] text-white/50">
                              Active
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-[10px] text-white/40 text-center">
                        Use the mobile app to deactivate →
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-2.5 rounded-lg bg-muted border border-border">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-muted-foreground" />
                          <div>
                            <div className="text-xs font-semibold">
                              Focus Mode
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Inactive
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleActivate}
                        className="w-full py-2.5 border-2 border-foreground bg-foreground text-background rounded-lg font-semibold text-xs hover:bg-transparent hover:text-foreground transition-all"
                      >
                        Activate Session
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Click outside to close popup */}
          {showPopup && !isActive && (
            <div
              className="fixed inset-0 z-0"
              onClick={() => setShowPopup(false)}
            />
          )}
        </div>

        {/* Arrow between demos (hidden on mobile) */}
        <div className="hidden lg:flex items-center justify-center py-8">
          <div
            className={`text-2xl transition-opacity duration-500 ${
              isActive ? "opacity-100" : "opacity-20"
            }`}
          >
            →
          </div>
        </div>

        {/* Mobile Phone Demo */}
        <div className="flex-shrink-0">
          <div className="text-center mb-4">
            <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Step 2: Mobile App
            </span>
          </div>

          {/* Phone Frame */}
          <div
            className={`relative w-[240px] rounded-[2.5rem] p-2 transition-all duration-500 ${
              isActive ? "bg-[#1a1a1a]" : "bg-foreground"
            }`}
          >
            {/* Phone Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-inherit rounded-b-2xl z-10" />

            {/* Phone Screen */}
            <div
              className={`rounded-[2rem] overflow-hidden transition-colors duration-500 ${
                isActive ? "bg-[#0f0f0f]" : "bg-background"
              }`}
            >
              {/* Status Bar */}
              <div
                className={`flex justify-between items-center px-6 pt-3 pb-2 text-[10px] ${
                  isActive ? "text-white/60" : "text-muted-foreground"
                }`}
              >
                <span>9:41</span>
              </div>

              {/* App Header */}
              <div
                className={`text-center py-4 ${isActive ? "text-white" : ""}`}
              >
                <span className="text-xs font-bold tracking-widest">
                  ANCHOR
                </span>
              </div>

              {/* App Content */}
              <div className="px-4 pb-6 min-h-[320px]">
                {isActive ? (
                  // Active Session Card
                  <div className="animate-in fade-in duration-500">
                    <div className="p-4 rounded-xl bg-[#171717] border border-white/10 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-white">
                          Focus Mode
                        </span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                          <span className="text-[10px] text-white/50 uppercase tracking-wider">
                            Active
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-white/40 mb-4">
                        Blocking 5 websites
                      </p>
                      <button
                        onClick={handleDeactivate}
                        className="w-full py-3 bg-white text-black rounded-lg font-semibold text-sm hover:bg-white/90 transition-all"
                      >
                        Deactivate Session
                      </button>
                    </div>
                    <p className="text-[10px] text-white/30 text-center">
                      Tap to stop blocking
                    </p>
                  </div>
                ) : (
                  // Empty State
                  <div className="flex flex-col items-center justify-center h-[280px] text-center">
                    <Image
                      src="/images/anchor-icon48.png"
                      alt="Anchor"
                      width={28}
                      height={28}
                      className="mb-3 rounded-lg"
                    />
                    <p className="text-sm font-medium mb-1">
                      No Active Session
                    </p>
                    <p className="text-[10px] text-muted-foreground max-w-[160px]">
                      Start a session from the browser extension
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Tab Bar */}
              <div
                className={`flex justify-center gap-8 py-3 border-t ${
                  isActive ? "border-white/10" : "border-border"
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-xs">Anchor</span>
                  <div
                    className={`w-1 h-1 rounded-full ${
                      isActive ? "bg-white" : "bg-foreground"
                    }`}
                  />
                </div>
                <div className="flex flex-col items-center gap-1 opacity-40">
                  <span className="text-xs">Profile</span>
                  <div className="w-1 h-1 rounded-full bg-transparent" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features List */}
      <div className="flex flex-col gap-32 lg:gap-48 mt-40 max-w-5xl mx-auto px-6">
        {/* Feature 1 - Number left, text right */}
        <ScrollReveal delay={0}>
          <div className="grid md:grid-cols-[200px_1fr] items-center gap-8 md:gap-16">
            <div className="text-[120px] lg:text-[180px] font-bold text-muted-foreground/10 leading-none select-none tracking-tighter">
              01
            </div>
            <div>
              <h4 className="text-3xl lg:text-4xl font-semibold mb-4 tracking-tight">
                Your rules, enforced
              </h4>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                Pick the sites that waste your time. We&apos;ll make sure you
                can&apos;t access them when you&apos;re supposed to be working.
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Feature 2 - Text left, number right */}
        <ScrollReveal delay={100}>
          <div className="grid md:grid-cols-[1fr_200px] items-center gap-8 md:gap-16">
            <div className="md:text-right md:order-1 order-2">
              <h4 className="text-3xl lg:text-4xl font-semibold mb-4 tracking-tight">
                Friction by design
              </h4>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                Getting distracted should be hard. Deactivating requires your
                phone—so you actually have to think about it.
              </p>
            </div>
            <div className="text-[120px] lg:text-[180px] font-bold text-muted-foreground/10 leading-none select-none tracking-tighter md:order-2 order-1 md:text-right">
              02
            </div>
          </div>
        </ScrollReveal>

        {/* Feature 3 - Number left, text right */}
        <ScrollReveal delay={200}>
          <div className="grid md:grid-cols-[200px_1fr] items-center gap-8 md:gap-16">
            <div className="text-[120px] lg:text-[180px] font-bold text-muted-foreground/10 leading-none select-none tracking-tighter">
              03
            </div>
            <div>
              <h4 className="text-3xl lg:text-4xl font-semibold mb-4 tracking-tight">
                Always in sync
              </h4>
              <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed">
                Changes propagate instantly. Block a site on one device,
                it&apos;s blocked everywhere. No delays, no loopholes.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
