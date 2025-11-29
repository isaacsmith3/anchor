"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = createClient();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      setSuccess(true);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      {/* Header */}
      <div className="text-center">
        <Link href="/" className="text-xl font-bold tracking-wider">
          ANCHOR
        </Link>
      </div>

      {/* Form Card */}
      <div className="border border-border rounded-xl p-8">
      {success ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">Check your email</h1>
              <p className="text-muted-foreground text-sm">
                Password reset instructions sent
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              If you registered using your email and password, you will receive
              a password reset email.
            </p>
            <div className="mt-6">
              <Link
                href="/auth/login"
                className="text-foreground font-semibold hover:underline text-sm"
              >
                ← Back to login
              </Link>
            </div>
          </>
      ) : (
          <>
            <div className="mb-8">
              <h1 className="text-2xl font-bold mb-2">Reset password</h1>
              <p className="text-muted-foreground text-sm">
                Enter your email and we&apos;ll send you a reset link
              </p>
            </div>

            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">
                {error && (
                  <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-sm text-red-600 dark:text-red-400">
                      {error}
                    </p>
                  </div>
                )}

                <div className="grid gap-2">
                  <Label htmlFor="email" className="text-sm font-semibold">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-2 focus:border-foreground"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 border-2 border-foreground bg-foreground text-background font-semibold rounded-lg transition-all hover:bg-transparent hover:text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Sending..." : "Send Reset Email"}
                </button>
              </div>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Remember your password?{" "}
                <Link
                  href="/auth/login"
                  className="text-foreground font-semibold hover:underline"
                >
                  Sign in
                </Link>
              </div>
            </form>
          </>
      )}
      </div>
    </div>
  );
}
