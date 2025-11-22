import { Nav } from "@/components/nav";
import Link from "next/link";

export default function PricingPage() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <Nav />
      <div className="flex-1 w-full flex flex-col gap-20 items-center">
        <div className="flex-1 flex flex-col gap-8 max-w-3xl p-5 items-center justify-center text-center">
          <h1 className="text-4xl lg:text-5xl font-bold">Pricing</h1>
          <div className="text-2xl lg:text-3xl font-semibold mt-8">Free</div>
          <p className="text-lg text-muted-foreground mt-4">
            Anchor is completely free to use.
          </p>
        </div>

        <footer className="w-full flex items-center justify-center border-t bg-background/70 mx-auto text-center text-lg gap-12 py-16">
          <Link
            className="font-bold hover:underline text-foreground transition"
            href="/"
          >
            Anchor
          </Link>
          <Link
            className="font-bold hover:underline text-foreground transition"
            href="/pricing"
          >
            Pricing
          </Link>
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
