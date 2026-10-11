import { revalidatePath } from "next/cache";
import { LIMITS } from "@/lib/menu/limits";
import { validateMenu } from "@/lib/menu/schema";
import { guardAdminRequest } from "@/lib/server/admin-auth";
import { errorResponse, json, readJsonBody } from "@/lib/server/http";
import { readMenuForAdmin, saveMenu } from "@/lib/server/menu-store";

export const dynamic = "force-dynamic";

/** Menu for the admin panel, including the version used to detect concurrent edits. */
export async function GET(request: Request) {
  const guard = await guardAdminRequest(request);
  if (!guard.ok) return guard.response;
  try {
    return json(await readMenuForAdmin());
  } catch {
    return errorResponse("No se pudo leer la carta guardada. Revisá que la migración de Supabase esté aplicada.", 503);
  }
}

export async function PUT(request: Request) {
  const guard = await guardAdminRequest(request);
  if (!guard.ok) return guard.response;
  const body = await readJsonBody(request, LIMITS.bodyBytes);
  if (!body.ok) return body.response;
  const payload = body.value as { menu?: unknown; baseUpdatedAt?: unknown } | null;
  if (!payload || typeof payload !== "object") return errorResponse("Los datos de la carta no son válidos.", 400);
  const baseUpdatedAt = typeof payload.baseUpdatedAt === "string" && payload.baseUpdatedAt.length <= 64 ? payload.baseUpdatedAt : null;
  const result = validateMenu(payload.menu);
  if (!result.ok) return errorResponse(result.error, 400);
  try {
    const saved = await saveMenu(result.menu, guard.admin.userId, baseUpdatedAt);
    if (!saved.ok) {
      return errorResponse("Otra persona guardó cambios mientras editabas. Recargá la carta para ver la versión actual antes de guardar.", 409);
    }
    revalidatePath("/");
    return json({ ok: true, updatedAt: saved.updatedAt });
  } catch {
    return errorResponse("No se pudieron guardar los cambios. Intentá de nuevo.", 500);
  }
}
