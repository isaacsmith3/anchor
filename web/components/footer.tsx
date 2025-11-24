import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full flex items-center justify-center border-t bg-background/70 mx-auto text-center text-lg gap-12 py-16">
      <Link
        className="font-bold hover:underline text-foreground transition"
        href="/contact"
      >
        Contact
      </Link>
    </footer>
  );
}
