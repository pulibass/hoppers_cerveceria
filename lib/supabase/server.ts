import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseConfig } from "./env";

/** Cookie-bound client for the signed-in user (route handlers and server components). */
export async function createClient() {
  const config = getPublicSupabaseConfig();
  if (!config) throw new Error("Supabase no está configurado.");
  const cookieStore = await cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: items => {
        // Server components cannot set cookies; the proxy refreshes the session instead.
        try { items.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
      },
    },
  });
}
