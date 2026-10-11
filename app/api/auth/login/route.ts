import { resolveAdmin } from "@/lib/server/admin-store";
import { EMAIL_PATTERN, errorResponse, isSameOrigin, json, normalizeEmail, readJsonBody } from "@/lib/server/http";
import { hasServiceRole } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse("Solicitud no permitida.", 403);
  if (!hasServiceRole()) return errorResponse("El panel todavía no está configurado (faltan variables de Supabase).", 503);
  const body = await readJsonBody(request, 4096);
  if (!body.ok) return body.response;
  const input = body.value as { email?: unknown; password?: unknown } | null;
  const email = normalizeEmail(input?.email);
  const password = typeof input?.password === "string" ? input.password : "";
  if (!EMAIL_PATTERN.test(email) || !password || password.length > 200) {
    return errorResponse("Correo o contraseña incorrectos.", 401);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error?.status === 429) return errorResponse("Demasiados intentos. Esperá unos minutos y volvé a intentar.", 429);
  if (error || !data.user?.email) return errorResponse("Correo o contraseña incorrectos.", 401);

  try {
    const admin = await resolveAdmin(data.user.id, data.user.email);
    if (!admin) {
      await supabase.auth.signOut();
      return errorResponse("Tu cuenta no está autorizada para editar la carta.", 403);
    }
    return json({ ok: true });
  } catch {
    await supabase.auth.signOut();
    return errorResponse("No se pudo verificar tu acceso. Revisá que la migración de Supabase esté aplicada.", 503);
  }
}
