"use client";

import { useEffect } from "react";

// If a redirect URL is not allow-listed in Supabase, auth emails fall back to the Site URL (`/`).
// Forward any auth callback that lands on the menu to the password screen, keeping its params.
export function AuthRedirect() {
  useEffect(() => {
    const { search, hash } = window.location;
    const query = new URLSearchParams(search);
    const fragment = new URLSearchParams(hash.slice(1));
    if (query.has("code") || query.has("token_hash") || query.has("error_code") || fragment.has("access_token") || fragment.has("error_code")) {
      window.location.replace(`/admin/password${search}${hash}`);
    }
  }, []);
  return null;
}
