import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import Link from "next/link";

async function UserDetails() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/auth/login");
  }

  return data.user.email;
}

async function SignOutButton() {
  return (
    <form action="/auth/logout" method="post">
      <button
        type="submit"
        className="border-2 border-foreground bg-transparent hover:bg-foreground text-foreground hover:text-background font-semibold px-6 py-2.5 rounded-lg transition-all duration-200 text-sm"
      >
        Sign Out
      </button>
    </form>
  );
}

export default function ProtectedPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="w-full flex justify-between items-center h-20 px-6 lg:px-28">
        <Link href="/" className="text-xl font-bold tracking-wider">
          ANCHOR
        </Link>
        <SignOutButton />
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="border border-border rounded-xl p-8">
            <h1 className="text-2xl font-bold mb-2">Profile</h1>
            <p className="text-muted-foreground text-sm mb-6">
              <Suspense fallback="Loading...">
            <UserDetails />
          </Suspense>
            </p>
            <div className="border-t border-border pt-6">
              <p className="text-sm text-muted-foreground">
                Manage your blocking sessions from the browser extension or
                mobile app.
              </p>
            </div>
      </div>
      </div>
      </main>
    </div>
  );
}
