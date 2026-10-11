import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// POST /api/auth/login: safe diagnostics for Supabase sign-in failures.

const state = vi.hoisted(() => ({
  signIn: (async () => ({ data: { user: null }, error: null })) as (credentials: { email: string; password: string }) => Promise<unknown>,
  createClientThrows: null as Error | null,
  isAdmin: true,
}));

vi.mock("@/lib/supabase/admin", () => ({ hasServiceRole: () => true }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    if (state.createClientThrows) throw state.createClientThrows;
    return { auth: { signInWithPassword: (credentials: { email: string; password: string }) => state.signIn(credentials), signOut: async () => ({ error: null }) } };
  },
}));
vi.mock("@/lib/server/admin-store", () => ({
  resolveAdmin: async (userId: string, email: string) => (state.isAdmin ? { userId, email, role: "owner" } : null),
}));

const { POST } = await import("@/app/api/auth/login/route");

const ORIGIN = "https://carta.example";
const EMAIL = "duenio@hoppers.com";
const PASSWORD = "contraseña-super-secreta";
const PUBLISHABLE_KEY = "sb_publishable_TESTKEY123456";
const SECRET_KEY = "sb_secret_TESTSECRET123456";

const login = () =>
  POST(new Request(`${ORIGIN}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    headers: { "content-type": "application/json", origin: ORIGIN, cookie: "sb-access-token=COOKIE_TOKEN_VALUE" },
  }));

const authError = (code: string | undefined, status: number, message: string) =>
  async () => ({ data: { user: null, session: null }, error: { code, status, message, name: "AuthApiError" } });

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://abcdefgh.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", PUBLISHABLE_KEY);
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", SECRET_KEY);
  state.signIn = async () => ({ data: { user: { id: "u1", email: EMAIL }, session: { access_token: "ACCESS_TOKEN_VALUE" } }, error: null });
  state.createClientThrows = null;
  state.isAdmin = true;
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
  vi.unstubAllEnvs();
});

/** Everything written to console.error, serialized, must not contain credentials or secrets. */
function expectNoSecretsLogged() {
  const logged = JSON.stringify(errorSpy.mock.calls);
  for (const secret of [EMAIL, PASSWORD, PUBLISHABLE_KEY, SECRET_KEY, "COOKIE_TOKEN_VALUE", "ACCESS_TOKEN_VALUE"]) {
    expect(logged).not.toContain(secret);
  }
}

const errorOf = async (response: Response) => ((await response.json()) as { error: string }).error;

describe("POST /api/auth/login diagnostics", () => {
  it("logs code, status, message and Supabase host for invalid_credentials", async () => {
    state.signIn = authError("invalid_credentials", 400, "Invalid login credentials");
    const response = await login();
    expect(response.status).toBe(401);
    expect(await errorOf(response)).toBe("Supabase rechazó las credenciales (invalid_credentials).");
    expect(errorSpy).toHaveBeenCalledWith("[auth/login] Supabase sign-in failed", {
      code: "invalid_credentials",
      status: 400,
      message: "Invalid login credentials",
      supabaseHost: "abcdefgh.supabase.co",
    });
    expectNoSecretsLogged();
  });

  it("reports email_not_confirmed", async () => {
    state.signIn = authError("email_not_confirmed", 400, "Email not confirmed");
    const response = await login();
    expect(response.status).toBe(403);
    expect(await errorOf(response)).toBe("El correo todavía no está confirmado.");
    expectNoSecretsLogged();
  });

  it("reports an invalid publishable key by code", async () => {
    state.signIn = authError("invalid_api_key", 400, "Invalid API key");
    const response = await login();
    expect(await errorOf(response)).toBe("La clave pública de Supabase no es válida.");
    expectNoSecretsLogged();
  });

  it("reports an invalid publishable key by status 401", async () => {
    state.signIn = authError(undefined, 401, "Unauthorized");
    const response = await login();
    expect(await errorOf(response)).toBe("La clave pública de Supabase no es válida.");
    expect(errorSpy).toHaveBeenCalledWith("[auth/login] Supabase sign-in failed", expect.objectContaining({ code: null, status: 401 }));
    expectNoSecretsLogged();
  });

  it("keeps a generic message for other errors but logs the real code", async () => {
    state.signIn = authError("unexpected_failure", 500, "Database error querying schema");
    const response = await login();
    expect(response.status).toBe(401);
    expect(await errorOf(response)).toBe("Correo o contraseña incorrectos.");
    expect(errorSpy).toHaveBeenCalledWith("[auth/login] Supabase sign-in failed", expect.objectContaining({ code: "unexpected_failure", status: 500 }));
    expectNoSecretsLogged();
  });

  it("keeps the rate-limit response", async () => {
    state.signIn = authError("over_request_rate_limit", 429, "Too many requests");
    expect((await login()).status).toBe(429);
  });

  it("captures network errors thrown by signInWithPassword", async () => {
    state.signIn = async () => { throw new TypeError("fetch failed"); };
    const response = await login();
    expect(response.status).toBe(503);
    expect(errorSpy).toHaveBeenCalledWith("[auth/login] Supabase sign-in threw", {
      name: "TypeError",
      message: "fetch failed",
      supabaseHost: "abcdefgh.supabase.co",
    });
    expectNoSecretsLogged();
  });

  it("captures errors thrown by createClient and tolerates a malformed URL", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not a url");
    state.createClientThrows = new Error("Supabase no está configurado.");
    const response = await login();
    expect(response.status).toBe(503);
    expect(errorSpy).toHaveBeenCalledWith("[auth/login] Supabase sign-in threw", expect.objectContaining({ supabaseHost: "invalid-url" }));
    expectNoSecretsLogged();
  });

  it("still signs in an authorized admin without logging anything", async () => {
    const response = await login();
    expect(response.status).toBe(200);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("still rejects accounts that are not admins", async () => {
    state.isAdmin = false;
    expect((await login()).status).toBe(403);
  });
});
