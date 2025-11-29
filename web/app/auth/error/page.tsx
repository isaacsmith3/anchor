import Link from "next/link";
import { Suspense } from "react";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-sm text-muted-foreground">
          Error code: {params.error}
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">
          An unspecified error occurred.
        </p>
      )}
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
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

          {/* Error Card */}
          <div className="border border-border rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-center justify-center">
              <span className="text-2xl">!</span>
            </div>
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <Suspense>
              <ErrorContent searchParams={searchParams} />
            </Suspense>
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
