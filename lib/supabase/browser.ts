"use client";
import { createBrowserClient } from "@supabase/ssr";

/** Browser client for password recovery flows. Returns null when Supabase is not configured. */
export function createBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return url && key ? createBrowserClient(url, key) : null;
}
