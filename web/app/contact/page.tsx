"use client";

import { useEffect, useState, useActionState } from "react";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import DotGrid from "@/components/DotGrid";
import { submitContact } from "./actions";

export default function ContactPage() {
  const [isDark, setIsDark] = useState(false);
  const [state, formAction] = useActionState(submitContact, {
    ok: false,
    error: null,
  });

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

        {/* Radial spotlight behind content */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: isDark
              ? "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(10, 10, 10, 0.9) 0%, rgba(10, 10, 10, 0.5) 40%, transparent 70%)"
              : "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.5) 40%, transparent 70%)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-lg w-full text-center">
          <h1
            className="text-5xl lg:text-6xl font-bold mb-4 tracking-tight"
            style={{
              textShadow: isDark
                ? "0 2px 20px rgba(0, 0, 0, 0.5)"
                : "0 2px 20px rgba(255, 255, 255, 0.8)",
            }}
          >
            Get in touch
          </h1>
          <p
            className="text-lg text-muted-foreground mb-12"
            style={{
              textShadow: isDark
                ? "0 1px 10px rgba(0, 0, 0, 0.3)"
                : "0 1px 10px rgba(255, 255, 255, 0.6)",
            }}
          >
            Questions, feedback, or just want to say hi?
          </p>

          <div className="bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-10 text-left">
            {state.ok ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  Message sent
                </p>
                <p className="text-sm text-muted-foreground">
                  Thanks for reaching out. We&apos;ll read this soon.
                </p>
              </div>
            ) : (
              <form action={formAction} className="space-y-6">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold text-foreground"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className="w-full h-11 rounded-lg border-2 border-input bg-background px-3 text-sm outline-none focus:border-foreground"
                    placeholder="you@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="message"
                    className="text-sm font-semibold text-foreground"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    className="w-full rounded-lg border-2 border-input bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
                    placeholder="Tell us what you have in mind…"
                  />
                </div>

                {state.error && (
                  <p className="text-sm text-red-500">{state.error}</p>
                )}

                <button
                  type="submit"
                  className="w-full border-2 border-foreground bg-foreground text-background font-semibold text-sm px-4 py-3 rounded-lg transition-all hover:bg-transparent hover:text-foreground"
                >
                  Send message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
