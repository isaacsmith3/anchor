import { Hero } from "@/components/hero";
import { Nav } from "@/components/nav";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Nav />
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <div className="flex-1 flex flex-col gap-20 max-w-5xl p-5 items-center justify-center">
          <Hero />
        </div>

        <footer className="w-full flex items-center justify-center border-t bg-background/70 mx-auto text-center text-lg gap-12 py-16">
          <Link
            className="font-bold hover:underline text-foreground transition"
            href="/contact"
          >
            Contact
          </Link>
        </footer>
      </div>
    </main>
  );
}
