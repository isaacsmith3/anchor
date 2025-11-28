"use client";

import { useEffect, useState } from "react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import DotGrid from "@/components/DotGrid";

export default function PricingPage() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const bgColor = isDark ? "#0f0f0f" : "rgb(255, 255, 255)";

  return (
    <main className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 relative flex flex-col items-center justify-center px-6 py-20 overflow-hidden">
        {/* DotGrid Background */}
        <div className="absolute inset-0">
          <DotGrid
            dotSize={4}
            gap={32}
            baseColor={isDark ? "#333333" : "#e0e0e0"}
            activeColor={isDark ? "#666666" : "#999999"}
            proximity={80}
            shockRadius={180}
            shockStrength={3}
            resistance={500}
            returnDuration={1}
            className="!p-0"
            style={{ height: "100%", width: "100%" }}
          />
        </div>

        {/* Gradient fades */}
        <div
          className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: `linear-gradient(to bottom, ${bgColor} 0%, transparent 100%)`,
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: `linear-gradient(to top, ${bgColor} 0%, transparent 100%)`,
          }}
        />
        <div
          className="absolute top-0 bottom-0 left-0 w-[25%] pointer-events-none"
          style={{
            background: `linear-gradient(to right, ${bgColor} 0%, transparent 100%)`,
          }}
        />
        <div
          className="absolute top-0 bottom-0 right-0 w-[25%] pointer-events-none"
          style={{
            background: `linear-gradient(to left, ${bgColor} 0%, transparent 100%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-md w-full text-center">
          <h1 className="text-5xl lg:text-6xl font-bold mb-4 tracking-tight">
            Simple pricing
          </h1>
          <p className="text-lg text-muted-foreground mb-12">
            Focus shouldn&apos;t cost you anything.
          </p>

          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-10">
            <div className="text-6xl lg:text-7xl font-bold mb-1 tracking-tight">
              $0
            </div>
            <p className="text-muted-foreground mb-10">Forever free</p>

            <ul className="text-left space-y-5 mb-10">
              <li className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium">
                  ✓
                </span>
                <span className="text-lg">Unlimited blocking sessions</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium">
                  ✓
                </span>
                <span className="text-lg">Browser extension</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium">
                  ✓
                </span>
                <span className="text-lg">iOS & Android app</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium">
                  ✓
                </span>
                <span className="text-lg">Real-time sync</span>
              </li>
              <li className="flex items-center gap-4">
                <span className="w-6 h-6 rounded-full bg-foreground text-background flex items-center justify-center text-sm font-medium">
                  ✓
                </span>
                <span className="text-lg">Custom blocking modes</span>
              </li>
            </ul>

            <a
              href="/auth/sign-up"
              className="inline-block w-full border-2 border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground font-semibold text-lg px-8 py-4 rounded-xl transition-all duration-200"
            >
              Get Started
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
