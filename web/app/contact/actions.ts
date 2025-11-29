"use server";

import { createClient } from "@/lib/supabase/server";

export async function submitContact(
  _prevState: { ok: boolean; error: string | null },
  formData: FormData
) {
  const emailRaw = formData.get("email");
  const messageRaw = formData.get("message");

  const email =
    typeof emailRaw === "string" && emailRaw.trim().length > 0
      ? emailRaw.trim()
      : null;
  const message = typeof messageRaw === "string" ? messageRaw.trim() : "";

  if (!message) {
    return { ok: false, error: "Message is required." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("contact_messages")
    .insert({ email, message });

  if (error) {
    console.error("Error saving contact message:", error);
    return {
      ok: false,
      error: "Something went wrong. Please try again.",
    };
  }

  return { ok: true, error: null };
}
