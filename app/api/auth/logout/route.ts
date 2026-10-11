import { isSameOrigin } from "@/lib/server/http";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (isSameOrigin(request) && isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  return Response.redirect(new URL("/admin/login", request.url), 303);
}
