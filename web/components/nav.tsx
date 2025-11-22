"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="flex gap-8 items-center justify-center font-semibold">
        <Link
          href={"/"}
          className="text-3xl lg:text-4xl font-bold"
        >
          Anchor
        </Link>
      </div>
      <div className="w-full max-w-5xl flex justify-center items-center p-3 px-5 text-sm">
        <div className="flex gap-8 items-center justify-center font-semibold">
          <Link
            href={"/"}
            className={
              pathname === "/"
                ? "underline hover:font-bold underline-offset-4 transition"
                : "hover:font-bold hover:underline transition hover:underline-offset-4"
            }
          >
            Home
          </Link>
          <Link
            href={"/pricing"}
            className={
              pathname === "/pricing"
                ? "underline hover:font-bold underline-offset-4 transition"
                : "hover:font-bold hover:underline transition hover:underline-offset-4"
            }
          >
            Pricing
          </Link>
          <Link
            href={"/contact"}
            className={
              pathname === "/contact"
                ? "underline hover:font-bold underline-offset-4 transition"
                : "hover:font-bold hover:underline transition hover:underline-offset-4"
            }
          >
            Contact
          </Link>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/protected"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-full transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Try it out
        </Link>
      </div>
    </nav>
  );
}
