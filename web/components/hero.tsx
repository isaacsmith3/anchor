import Link from "next/link";

export function Hero() {
  return (
    <div className="flex flex-col gap-10 items-center text-center py-20">
      <h1 className="text-5xl lg:text-7xl font-bold !leading-tight mx-auto max-w-4xl tracking-tight">
        Lock In On What&apos;s Important
      </h1>
      <p className="text-lg lg:text-xl text-muted-foreground mx-auto max-w-2xl leading-relaxed">
        Anchor blocks distracting websites with NFC friction. Stay focused and
        get things done.
      </p>
      <div className="flex gap-4 mt-4">
        <Link
          href="/auth/sign-up"
          className="border-2 border-foreground bg-foreground text-background hover:bg-transparent hover:text-foreground font-semibold px-8 py-3 rounded-lg transition-all duration-200"
        >
          Get Started
        </Link>
        <Link
          href="/pricing"
          className="border-2 border-border bg-transparent hover:border-foreground text-foreground font-semibold px-8 py-3 rounded-lg transition-all duration-200"
        >
          View Pricing
        </Link>
      </div>
    </div>
  );
}
