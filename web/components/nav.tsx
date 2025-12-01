"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

export function Nav() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
    { href: "/contact", label: "Contact" },
  ];

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className="w-full flex justify-between items-center border-b border-foreground/10 h-16 md:h-20 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 px-4 sm:px-6 lg:px-28">
        {/* Logo */}
        <div className="flex items-center justify-start font-semibold flex-shrink-0">
          <Link
            href={"/"}
            className="text-2xl sm:text-3xl lg:text-4xl font-bold"
          >
            ANCHOR
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex flex-1 justify-center items-center">
          <div className="flex gap-8 lg:gap-12 items-center justify-center">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center gap-2 group"
                >
                  <span
                    className={`text-xs tracking-widest uppercase transition-all ${
                      isActive
                        ? "font-bold text-foreground"
                        : "font-medium text-muted-foreground group-hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                  <span
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      isActive ? "bg-foreground" : "bg-transparent"
                    }`}
                  />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Desktop CTA Button */}
        <div className="hidden md:flex items-center justify-end flex-shrink-0">
          <Link
            href="/contact"
            className="border-2 border-foreground bg-transparent hover:bg-foreground text-foreground hover:text-background font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 text-sm whitespace-nowrap"
          >
            Try it out
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden flex items-center justify-center w-10 h-10 text-foreground hover:text-muted-foreground transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Mobile Menu Panel */}
          <div className="absolute top-16 left-0 right-0 bg-background border-b border-foreground/10 shadow-lg">
            <div className="flex flex-col">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-6 py-4 border-b border-foreground/5 transition-colors ${
                      isActive
                        ? "bg-foreground/5 text-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm tracking-widest uppercase">
                        {item.label}
                      </span>
                      {isActive && (
                        <span className="w-2 h-2 rounded-full bg-foreground" />
                      )}
                    </div>
                  </Link>
                );
              })}

              {/* Mobile CTA Button */}
              <div className="px-6 py-4 border-t border-foreground/10">
                <Link
                  href="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full text-center border-2 border-foreground bg-transparent hover:bg-foreground text-foreground hover:text-background font-semibold px-6 py-3 rounded-lg transition-all duration-200 text-sm"
                >
                  Try it out
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
