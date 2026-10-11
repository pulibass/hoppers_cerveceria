import "server-only";
import { defaultMenu } from "@/lib/menu/default-menu";
import { normalizeMenu } from "@/lib/menu/normalize";
import type { MenuData } from "@/lib/menu/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createPublicClient } from "@/lib/supabase/public";

const MENU_ID = "menu";

const isBuildPhase = () => process.env.NEXT_PHASE === "phase-production-build";

export class StoreError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
  }
}

/**
 * Menu for the public page. Falls back to the default menu when Supabase is not configured,
 * the row does not exist yet, or (only during the build) Supabase cannot be reached.
 * At runtime a read error is thrown so ISR keeps serving the last good page instead of
 * replacing real prices with the defaults.
 */
export async function readPublicMenu(): Promise<MenuData> {
  if (!isSupabaseConfigured()) return defaultMenu;
  const { data, error } = await createPublicClient().from("site_content").select("data").eq("id", MENU_ID).maybeSingle();
  if (error) {
    if (isBuildPhase()) {
      console.warn("[menu] No se pudo leer Supabase durante el build; se usa la carta predeterminada.");
      return defaultMenu;
    }
    throw new StoreError("No se pudo leer la carta desde Supabase.", error.code);
  }
  return data ? normalizeMenu(data.data, defaultMenu) : defaultMenu;
}

export type StoredMenu = { menu: MenuData; updatedAt: string | null };

/** Menu for the admin panel, with the version timestamp used for conflict detection. */
export async function readMenuForAdmin(): Promise<StoredMenu> {
  const { data, error } = await createAdminClient().from("site_content").select("data, updated_at").eq("id", MENU_ID).maybeSingle();
  if (error) throw new StoreError("No se pudo leer la carta guardada.", error.code);
  if (!data) return { menu: defaultMenu, updatedAt: null };
  return { menu: normalizeMenu(data.data, defaultMenu), updatedAt: String(data.updated_at) };
}

export type SaveResult = { ok: true; updatedAt: string } | { ok: false; conflict: true };

/**
 * Saves the menu only if nobody else saved since `baseUpdatedAt` (optimistic locking).
 * `baseUpdatedAt = null` means the editor started from the default menu (no row yet).
 */
export async function saveMenu(menu: MenuData, userId: string, baseUpdatedAt: string | null): Promise<SaveResult> {
  const supabase = createAdminClient();
  const updatedAt = new Date().toISOString();
  if (baseUpdatedAt === null) {
    const { data, error } = await supabase
      .from("site_content")
      .insert({ id: MENU_ID, data: menu, updated_at: updatedAt, updated_by: userId })
      .select("updated_at")
      .single();
    if (error?.code === "23505") return { ok: false, conflict: true };
    if (error || !data) throw new StoreError("No se pudo guardar la carta.", error?.code);
    return { ok: true, updatedAt: String(data.updated_at) };
  }
  const { data, error } = await supabase
    .from("site_content")
    .update({ data: menu, updated_at: updatedAt, updated_by: userId })
    .eq("id", MENU_ID)
    .eq("updated_at", baseUpdatedAt)
    .select("updated_at");
  if (error) throw new StoreError("No se pudo guardar la carta.", error.code);
  const saved = data?.[0];
  if (!saved) return { ok: false, conflict: true };
  return { ok: true, updatedAt: String(saved.updated_at) };
}
