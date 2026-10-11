import "server-only";
import { redirect } from "next/navigation";
import { hasServiceRole } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resolveAdmin, type AdminRecord } from "./admin-store";
import { errorResponse, isSameOrigin } from "./http";

export type AuthenticatedAdmin = AdminRecord;

/** Signed-in admin for the current request, or null. The session is verified with Supabase Auth. */
export async function getAuthenticatedAdmin(): Promise<AuthenticatedAdmin | null> {
  if (!hasServiceRole()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;
  return resolveAdmin(user.id, user.email);
}

export async function requireAdminPage(): Promise<AuthenticatedAdmin> {
  const admin = await getAuthenticatedAdmin().catch(() => null);
  if (!admin) redirect("/admin/login");
  return admin;
}

export type AdminGuard = { ok: true; admin: AuthenticatedAdmin } | { ok: false; response: Response };

/**
 * Guard for admin API routes: same-origin check for state-changing methods,
 * a valid session, an admin record and (optionally) the owner role.
 */
export async function guardAdminRequest(request: Request, options: { ownerOnly?: boolean } = {}): Promise<AdminGuard> {
  if (request.method !== "GET" && !isSameOrigin(request)) {
    return { ok: false, response: errorResponse("Solicitud no permitida.", 403) };
  }
  if (!hasServiceRole()) return { ok: false, response: errorResponse("El panel no está configurado en el servidor.", 503) };
  let admin: AuthenticatedAdmin | null;
  try {
    admin = await getAuthenticatedAdmin();
  } catch {
    return { ok: false, response: errorResponse("No se pudo verificar tu acceso. Intentá de nuevo.", 503) };
  }
  if (!admin) return { ok: false, response: errorResponse("Tu sesión expiró. Volvé a iniciar sesión.", 401) };
  if (options.ownerOnly && admin.role !== "owner") {
    return { ok: false, response: errorResponse("Solo el propietario puede administrar el equipo.", 403) };
  }
  return { ok: true, admin };
}
