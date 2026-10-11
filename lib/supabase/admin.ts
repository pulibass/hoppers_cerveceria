import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseConfig } from "./env";

/** True when the server can use the secret key (sb_secret_… or legacy service_role JWT). */
export function hasServiceRole(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  return Boolean(getPublicSupabaseConfig() && key && !key.startsWith("sb_publishable_"));
}

/**
 * Privileged client that bypasses RLS. Only for authenticated server routes;
 * never import from client components and never return the key or raw errors that may contain it.
 */
export function createAdminClient() {
  const config = getPublicSupabaseConfig();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!config || !key) throw new Error("Supabase no está configurado en el servidor.");
  if (key.startsWith("sb_publishable_")) throw new Error("SUPABASE_SERVICE_ROLE_KEY debe ser la clave secreta, no la publicable.");
  return createClient(config.url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } });
}
