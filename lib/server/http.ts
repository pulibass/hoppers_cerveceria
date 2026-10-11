// Small helpers shared by the route handlers.

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function errorResponse(message: string, status: number): Response {
  return json({ error: message }, status);
}

/**
 * Rejects cross-site requests to cookie-authenticated endpoints (CSRF).
 * Browsers always send Origin / Sec-Fetch-Site on fetch POST/PUT/DELETE.
 */
export function isSameOrigin(request: Request): boolean {
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite && fetchSite !== "same-origin" && fetchSite !== "none") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export type JsonBodyResult = { ok: true; value: unknown } | { ok: false; response: Response };

/** Parses a JSON body enforcing content type and a maximum size in bytes. */
export async function readJsonBody(request: Request, maxBytes: number): Promise<JsonBodyResult> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return { ok: false, response: errorResponse("Formato de solicitud no admitido.", 415) };
  }
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return { ok: false, response: errorResponse("Los datos enviados son demasiado grandes.", 413) };
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return { ok: false, response: errorResponse("Los datos enviados son demasiado grandes.", 413) };
  }
  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false, response: errorResponse("Los datos enviados no son JSON válido.", 400) };
  }
}

export const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,63}$/;

export function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase().slice(0, 254) : "";
}
