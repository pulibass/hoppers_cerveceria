import { guardAdminRequest } from "@/lib/server/admin-auth";
import { listAdmins } from "@/lib/server/admin-store";
import { errorResponse, json } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await guardAdminRequest(request);
  if (!guard.ok) return guard.response;
  const { admin } = guard;
  try {
    const admins = admin.role === "owner" ? await listAdmins() : [];
    return json({ email: admin.email, role: admin.role, userId: admin.userId, admins });
  } catch {
    return errorResponse("No se pudo leer el equipo.", 503);
  }
}
