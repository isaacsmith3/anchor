import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

const getSafeRedirectPath = (path: string | null) => {
  if (!path) {
    return "/";
  }
  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }
  return path;
};

const redirectToError = (message: string) => {
  redirect(`/auth/error?error=${encodeURIComponent(message)}`);
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = getSafeRedirectPath(searchParams.get("next"));

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      // redirect user to specified redirect URL or root of app
      redirect(next);
    } else {
      // redirect the user to an error page with some instructions
      redirectToError(error?.message ?? "Unknown verification error");
    }
  }

  // redirect the user to an error page with some instructions
  redirectToError("No token hash or type");
}
