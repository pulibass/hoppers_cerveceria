import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "./env";

/** Anonymous client used to read the public menu (allowed by the RLS select policy). */
export function createPublicClient() {
  const config = getPublicSupabaseConfig();
  if (!config) throw new Error("Supabase no está configurado.");
  return createClient(config.url, config.key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
