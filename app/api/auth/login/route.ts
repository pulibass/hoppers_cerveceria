import { resolveAdmin } from "@/lib/server/admin-store";
import { EMAIL_PATTERN, errorResponse, isSameOrigin, json, normalizeEmail, readJsonBody } from "@/lib/server/http";
import { hasServiceRole } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const GENERIC_LOGIN_ERROR = "Correo o contraseña incorrectos.";

/** Supabase host for diagnostics. Only the hostname is logged, never keys or full URLs with params. */
function supabaseHost(): string {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname || "missing";
  } catch {
    return "invalid-url";
  }
}

type SignInError = { code?: string; status?: number; message: string };

/** Maps a Supabase sign-in error to a safe response. Logs only code, status, message and host. */
function signInErrorResponse(error: SignInError): Response {
  console.error("[auth/login] Supabase sign-in failed", {
    code: error.code ?? null,
    status: error.status ?? null,
    message: error.message,
    supabaseHost: supabaseHost(),
  });
  if (error.status === 429) return errorResponse("Demasiados intentos. Esperá unos minutos y volvé a intentar.", 429);
  if (error.code === "invalid_credentials") return errorResponse("Supabase rechazó las credenciales (invalid_credentials).", 401);
  if (error.code === "email_not_confirmed") return errorResponse("El correo todavía no está confirmado.", 403);
  if (error.code === "invalid_api_key" || error.status === 401) return errorResponse("La clave pública de Supabase no es válida.", 503);
  return errorResponse(GENERIC_LOGIN_ERROR, 401);
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return errorResponse("Solicitud no permitida.", 403);
  if (!hasServiceRole()) return errorResponse("El panel todavía no está configurado (faltan variables de Supabase).", 503);
  const body = await readJsonBody(request, 4096);
  if (!body.ok) return body.response;
  const input = body.value as { email?: unknown; password?: unknown } | null;
  const email = normalizeEmail(input?.email);
  const password = typeof input?.password === "string" ? input.password : "";
  if (!EMAIL_PATTERN.test(email) || !password || password.length > 200) {
    return errorResponse(GENERIC_LOGIN_ERROR, 401);
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;
  let result: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;
  try {
    supabase = await createClient();
    result = await supabase.auth.signInWithPassword({ email, password });
  } catch (cause) {
    // Network failures or a wrong Supabase URL: log the cause (no credentials) instead of a bare 500.
    console.error("[auth/login] Supabase sign-in threw", {
      name: cause instanceof Error ? cause.name : typeof cause,
      message: cause instanceof Error ? cause.message : String(cause),
      supabaseHost: supabaseHost(),
    });
    return errorResponse("No se pudo conectar con Supabase. Intentá de nuevo en unos minutos.", 503);
  }

  const { data, error } = result;
  if (error) return signInErrorResponse(error);
  if (!data.user?.email) return errorResponse(GENERIC_LOGIN_ERROR, 401);

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
