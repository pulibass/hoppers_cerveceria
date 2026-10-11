import { guardAdminRequest } from "@/lib/server/admin-auth";
import { inviteEditor, listAdmins, removeEditor } from "@/lib/server/admin-store";
import { EMAIL_PATTERN, errorResponse, json, normalizeEmail, readJsonBody } from "@/lib/server/http";

export const dynamic = "force-dynamic";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Owner invites an editor by email. */
export async function POST(request: Request) {
  const guard = await guardAdminRequest(request, { ownerOnly: true });
  if (!guard.ok) return guard.response;
  const body = await readJsonBody(request, 2048);
  if (!body.ok) return body.response;
  const email = normalizeEmail((body.value as { email?: unknown } | null)?.email);
  if (!EMAIL_PATTERN.test(email)) return errorResponse("Ingresá un correo válido.", 400);
  if (email === guard.admin.email.toLowerCase()) return errorResponse("Ese correo ya es el tuyo.", 400);
  // Invitations land on /auth/confirm (token_hash template) or /admin/password (default template).
  const redirectTo = new URL("/admin/password", request.url).toString();
  try {
    const result = await inviteEditor(email, redirectTo);
    if (!result.ok) return errorResponse(result.error, 400);
    return json({ ok: true, invited: result.invited, admins: await listAdmins() });
  } catch {
    return errorResponse("No se pudo sumar al editor. Intentá de nuevo.", 500);
  }
}

/** Owner removes an editor's access. */
export async function DELETE(request: Request) {
  const guard = await guardAdminRequest(request, { ownerOnly: true });
  if (!guard.ok) return guard.response;
  const body = await readJsonBody(request, 1024);
  if (!body.ok) return body.response;
  const userId = (body.value as { userId?: unknown } | null)?.userId;
  if (typeof userId !== "string" || !UUID_PATTERN.test(userId)) return errorResponse("Elegí una persona válida.", 400);
  if (userId === guard.admin.userId) return errorResponse("No podés quitarte el acceso a vos mismo.", 400);
  try {
    const removed = await removeEditor(userId);
    if (!removed) return errorResponse("No se encontró ese editor.", 404);
    return json({ ok: true, admins: await listAdmins() });
  } catch {
    return errorResponse("No se pudo quitar el acceso. Intentá de nuevo.", 500);
  }
}
