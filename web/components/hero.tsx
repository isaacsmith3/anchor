"use client";

import { useEffect, useState } from "react";
import DotGrid from "@/components/DotGrid";

export function Hero() {
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

  const bgColor = isDark ? " #0f0f0f" : "rgb(255, 255, 255)";

  return (
    <div className="relative w-full min-h-[400px] sm:min-h-[500px] lg:min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* DotGrid Background - smaller dots, more spacing */}
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

      {/* Top fade - smooth transition from nav */}
      <div
        className="absolute top-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, ${bgColor} 0%, transparent 100%)`,
        }}
      />

      {/* Bottom fade - smooth transition to demo section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{
          background: `linear-gradient(to top, ${bgColor} 0%, transparent 100%)`,
        }}
      />

      {/* Left fade - harsher, concentrates dots toward center */}
      <div
        className="absolute top-0 bottom-0 left-0 w-[30%] pointer-events-none"
        style={{
          background: `linear-gradient(to right, ${bgColor} 0%, ${bgColor} 20%, transparent 100%)`,
        }}
      />

      {/* Right fade - harsher, concentrates dots toward center */}
      <div
        className="absolute top-0 bottom-0 right-0 w-[30%] pointer-events-none"
        style={{
          background: `linear-gradient(to left, ${bgColor} 0%, ${bgColor} 20%, transparent 100%)`,
        }}
      />

      {/* Radial spotlight behind text - creates depth without harsh lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(10, 10, 10, 0.9) 0%, rgba(10, 10, 10, 0.5) 40%, transparent 70%)"
            : "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.5) 40%, transparent 70%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-4 sm:gap-5 items-center text-center px-4 sm:px-6">
        <h1
          className="text-3xl sm:text-4xl lg:text-6xl font-bold !leading-tight mx-auto max-w-3xl"
          style={{
            textShadow: isDark
              ? "0 2px 20px rgba(0, 0, 0, 0.5)"
              : "0 2px 20px rgba(255, 255, 255, 0.8)",
          }}
        >
          Lock In On What&apos;s Important
        </h1>
        <p
          className="text-base sm:text-lg lg:text-xl text-muted-foreground mx-auto max-w-2xl px-2"
          style={{
            textShadow: isDark
              ? "0 1px 10px rgba(0, 0, 0, 0.3)"
              : "0 1px 10px rgba(255, 255, 255, 0.6)",
          }}
        >
          Anchor blocks distracting websites with NFC friction. Stay focused and
          get things done.
        </p>
      </div>
    </div>
  );
}
