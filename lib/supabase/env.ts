// Supabase configuration. NEXT_PUBLIC_* values are inlined at build time, so they must be
// referenced literally. The secret key is read only in server modules (see admin.ts).

export function getPublicSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return url && key ? { url, key } : null;
}

export function isSupabaseConfigured(): boolean {
  return getPublicSupabaseConfig() !== null;
}
