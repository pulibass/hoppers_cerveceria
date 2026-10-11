import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { StoreError } from "./menu-store";
import { decideOwnerBootstrap, isOwnerEmail, type AdminRole } from "./owner";

export type AdminRecord = { userId: string; email: string; role: AdminRole };

type Row = { user_id: string; email: string; role: string };
const toRecord = (row: Row): AdminRecord => ({ userId: row.user_id, email: row.email, role: row.role === "owner" ? "owner" : "editor" });

export async function getAdmin(userId: string): Promise<AdminRecord | null> {
  const { data, error } = await createAdminClient().from("admins").select("user_id, email, role").eq("user_id", userId).maybeSingle();
  if (error) throw new StoreError("No se pudo verificar el acceso.", error.code);
  return data ? toRecord(data as Row) : null;
}

async function ownerExists(): Promise<boolean> {
  const { count, error } = await createAdminClient().from("admins").select("user_id", { count: "exact", head: true }).eq("role", "owner");
  if (error) throw new StoreError("No se pudo verificar el acceso.", error.code);
  return (count ?? 0) > 0;
}

/** Returns the admin record for a signed-in user, registering OWNER_EMAIL as owner on first login. */
export async function resolveAdmin(userId: string, email: string): Promise<AdminRecord | null> {
  const current = await getAdmin(userId);
  const ownerEmail = process.env.OWNER_EMAIL;
  // Only query for an existing owner when the decision depends on it.
  const exists = current?.role !== "owner" && isOwnerEmail(email, ownerEmail) ? await ownerExists() : true;
  const decision = decideOwnerBootstrap({ email, ownerEmail, currentRole: current?.role ?? null, ownerExists: exists });
  if (decision === "keep") return current;
  if (decision === "deny") return null;
  const supabase = createAdminClient();
  const { error } = decision === "create-owner"
    ? await supabase.from("admins").insert({ user_id: userId, email: email.trim().toLowerCase(), role: "owner" })
    : await supabase.from("admins").update({ role: "owner" }).eq("user_id", userId);
  // 23505: another request registered an owner at the same time (single-owner unique index).
  if (error && error.code !== "23505") throw new StoreError("No se pudo registrar al propietario.", error.code);
  return getAdmin(userId);
}

export async function listAdmins(): Promise<AdminRecord[]> {
  const { data, error } = await createAdminClient().from("admins").select("user_id, email, role").order("created_at");
  if (error) throw new StoreError("No se pudo leer el equipo.", error.code);
  return (data as Row[]).map(toRecord).sort((a, b) => (a.role === b.role ? 0 : a.role === "owner" ? -1 : 1));
}

async function findUserIdByEmail(email: string): Promise<string | null> {
  const supabase = createAdminClient();
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return null;
    const match = data.users.find(user => user.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 200) return null;
  }
  return null;
}

export type InviteResult = { ok: true; invited: boolean } | { ok: false; error: string };

/** Invites an editor by email. Existing Supabase accounts keep their password and just gain access. */
export async function inviteEditor(email: string, redirectTo: string): Promise<InviteResult> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo });
  let userId = data?.user?.id ?? null;
  const invited = Boolean(userId);
  if (!userId && error?.code === "email_exists") userId = await findUserIdByEmail(email);
  if (!userId) {
    if (error?.status === 429) return { ok: false, error: "Se enviaron demasiados correos. Esperá unos minutos." };
    return { ok: false, error: "No se pudo enviar la invitación. Revisá el correo e intentá de nuevo." };
  }
  const { error: insertError } = await supabase
    .from("admins")
    .upsert({ user_id: userId, email, role: "editor" }, { onConflict: "user_id", ignoreDuplicates: true });
  if (insertError) return { ok: false, error: "La cuenta existe, pero no se pudo dar acceso. Intentá de nuevo." };
  return { ok: true, invited };
}

/** Removes editor access. The owner row can never be deleted through the panel. */
export async function removeEditor(userId: string): Promise<boolean> {
  const { data, error } = await createAdminClient().from("admins").delete().eq("user_id", userId).eq("role", "editor").select("user_id");
  if (error) throw new StoreError("No se pudo quitar el acceso.", error.code);
  return Boolean(data?.length);
}
