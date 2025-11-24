"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="w-full flex justify-between items-center border-b border-b-foreground/10 h-20 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 px-6 lg:px-28">
      <div className="flex items-center justify-start font-semibold">
        <Link href={"/"} className="text-3xl lg:text-4xl font-bold">
          ANCHOR
        </Link>
      </div>
      <div className="flex-1 flex justify-center items-center">
        <div className="flex gap-10 lg:gap-12 items-center justify-center font-semibold">
          <Link
            href={"/"}
            className={
              pathname === "/"
                ? "underline hover:font-bold underline-offset-4 transition px-2 py-1"
                : "hover:font-bold hover:underline transition hover:underline-offset-4 px-2 py-1"
            }
          >
            Home
          </Link>
          <Link
            href={"/pricing"}
            className={
              pathname === "/pricing"
                ? "underline hover:font-bold underline-offset-4 transition px-2 py-1"
                : "hover:font-bold hover:underline transition hover:underline-offset-4 px-2 py-1"
            }
          >
            Pricing
          </Link>
          <Link
            href={"/contact"}
            className={
              pathname === "/contact"
                ? "underline hover:font-bold underline-offset-4 transition px-2 py-1"
                : "hover:font-bold hover:underline transition hover:underline-offset-4 px-2 py-1"
            }
          >
            Contact
          </Link>
        </div>
      </div>
      <div className="flex items-center justify-end">
        <Link
          href="/protected"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-full transition-colors duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Try it out
        </Link>
      </div>
    </nav>
  );
}
