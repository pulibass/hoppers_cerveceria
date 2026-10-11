import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Only private areas need session refresh; the public menu stays cacheable.
export const config = { matcher: ["/admin/:path*", "/api/:path*", "/auth/:path*"] };
