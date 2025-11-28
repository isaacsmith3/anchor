import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="text-xl font-bold tracking-wider">
              ANCHOR
            </Link>
          </div>

          {/* Card */}
          <div className="border border-border rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-card border border-border flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">Check your email</h1>
            <p className="text-muted-foreground text-sm mb-6">
              We&apos;ve sent you a confirmation link
            </p>
            <p className="text-sm text-muted-foreground">
              Please check your email to confirm your account before signing in.
            </p>
            <div className="mt-8">
              <Link
                href="/auth/login"
                className="text-foreground font-semibold hover:underline text-sm"
              >
                ← Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
