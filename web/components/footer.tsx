"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className="w-full border-t border-border py-12">
      <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-sm text-muted-foreground">
          © {year ?? "2025"} Anchor. All rights reserved.
        </div>
        <div className="flex gap-8">
          <Link
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            href="/contact"
          >
            Contact
          </Link>
          <Link
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            href="/pricing"
          >
            Pricing
          </Link>
        </div>
      </div>
    </footer>
  );
}
