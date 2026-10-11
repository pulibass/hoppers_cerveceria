import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNextPath } from "@/lib/safe-path";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const OTP_TYPES: readonly EmailOtpType[] = ["invite", "recovery", "signup", "magiclink", "email_change", "email"];

// Target of the email templates that use {{ .TokenHash }} (invitation and password recovery):
// {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/admin/password
// It works even if the email is opened in a different browser than the one that requested it.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"));
  if (tokenHash && type && OTP_TYPES.includes(type) && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const target = new URL(next, request.url);
      if (type === "recovery") target.searchParams.set("type", "recovery");
      return NextResponse.redirect(target);
    }
  }
  return NextResponse.redirect(new URL("/admin/password?error=invalid_link", request.url));
}
