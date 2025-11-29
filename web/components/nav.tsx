"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home" },
    { href: "/pricing", label: "Pricing" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="w-full flex justify-between items-center border-b-foreground/10 h-20 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 px-6 lg:px-28">
      <div className="flex items-center justify-start font-semibold">
        <Link href={"/"} className="text-3xl lg:text-4xl font-bold">
          ANCHOR
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 flex justify-center items-center">
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

      {/* CTA Button */}
      <div className="flex items-center justify-end">
        <Link
          href="/protected"
          className="border-2 border-foreground bg-transparent hover:bg-foreground text-foreground hover:text-background font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 text-sm"
        >
          Try it out
        </Link>
      </div>
    </nav>
  );
}
