import { beforeEach, describe, expect, it, vi } from "vitest";
import { defaultMenu } from "@/lib/menu/default-menu";

// Route handlers are tested with the real guard logic; only Supabase access is mocked.

const state = vi.hoisted(() => ({
  user: null as { id: string; email: string } | null,
  role: null as "owner" | "editor" | null,
  saveResult: { ok: true, updatedAt: "2026-10-10T00:00:00.000Z" } as { ok: true; updatedAt: string } | { ok: false; conflict: true },
  uploads: [] as string[],
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  hasServiceRole: () => true,
  createAdminClient: () => ({
    storage: {
      from: () => ({
        upload: async (path: string) => { state.uploads.push(path); return { error: null }; },
        getPublicUrl: (path: string) => ({ data: { publicUrl: `https://project.supabase.co/storage/v1/object/public/product-images/${path}` } }),
      }),
    },
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }),
}));
vi.mock("@/lib/server/admin-store", () => ({
  resolveAdmin: async (userId: string, email: string) => (state.role ? { userId, email, role: state.role } : null),
  listAdmins: async () => [],
  inviteEditor: vi.fn(async () => ({ ok: true, invited: true })),
  removeEditor: vi.fn(async () => true),
}));
vi.mock("@/lib/server/menu-store", () => ({
  saveMenu: vi.fn(async () => state.saveResult),
  readMenuForAdmin: async () => ({ menu: defaultMenu, updatedAt: null }),
}));

const { PUT } = await import("@/app/api/menu/route");
const { POST: upload } = await import("@/app/api/upload/route");
const { POST: invite } = await import("@/app/api/admin/team/route");
const { revalidatePath } = await import("next/cache");

const ORIGIN = "https://carta.example";
const putMenu = (body: unknown, headers: Record<string, string> = {}) =>
  PUT(new Request(`${ORIGIN}/api/menu`, { method: "PUT", body: JSON.stringify(body), headers: { "content-type": "application/json", origin: ORIGIN, ...headers } }));

beforeEach(() => {
  state.user = { id: "11111111-1111-4111-8111-111111111111", email: "editor@hoppers.com" };
  state.role = "editor";
  state.saveResult = { ok: true, updatedAt: "2026-10-10T00:00:00.000Z" };
  state.uploads = [];
  vi.mocked(revalidatePath).mockClear();
});

describe("PUT /api/menu", () => {
  it("requires a session", async () => {
    state.user = null;
    expect((await putMenu({ menu: defaultMenu })).status).toBe(401);
  });

  it("rejects signed-in users that are not admins", async () => {
    state.role = null;
    expect((await putMenu({ menu: defaultMenu })).status).toBe(401);
  });

  it("rejects cross-site requests", async () => {
    expect((await putMenu({ menu: defaultMenu }, { origin: "https://evil.example" })).status).toBe(403);
  });

  it("validates the menu on the server", async () => {
    const menu = structuredClone(defaultMenu);
    menu.categories[0]!.items[0]!.price = -5;
    const response = await putMenu({ menu });
    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: string }).error).toMatch(/precio/);
  });

  it("returns 409 when someone else saved first", async () => {
    state.saveResult = { ok: false, conflict: true };
    expect((await putMenu({ menu: defaultMenu, baseUpdatedAt: "2026-01-01T00:00:00Z" })).status).toBe(409);
  });

  it("saves and revalidates the public page", async () => {
    const response = await putMenu({ menu: defaultMenu, baseUpdatedAt: null });
    expect(response.status).toBe(200);
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});

describe("POST /api/upload", () => {
  const send = (file: File) => {
    const form = new FormData();
    form.append("image", file);
    return upload(new Request(`${ORIGIN}/api/upload`, { method: "POST", body: form, headers: { origin: ORIGIN } }));
  };

  it("rejects a non-image disguised as JPEG", async () => {
    const response = await send(new File(["<script>alert(1)</script>"], "x.jpg", { type: "image/jpeg" }));
    expect(response.status).toBe(415);
    expect(state.uploads).toHaveLength(0);
  });

  it("rejects images over 4 MB", async () => {
    const big = new Uint8Array(4 * 1024 * 1024 + 10);
    big.set([0xff, 0xd8, 0xff]);
    const response = await send(new File([big], "big.jpg", { type: "image/jpeg" }));
    expect(response.status).toBe(413);
  });

  it("stores a valid image under a random name and returns its public URL", async () => {
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const response = await send(new File([png], "foto.png", { type: "image/png" }));
    expect(response.status).toBe(200);
    expect(state.uploads[0]).toMatch(/^products\/[0-9a-f-]{36}\.png$/);
    expect(((await response.json()) as { url: string }).url).toContain("/product-images/products/");
  });
});

describe("POST /api/admin/team", () => {
  const send = (email: string) =>
    invite(new Request(`${ORIGIN}/api/admin/team`, { method: "POST", body: JSON.stringify({ email }), headers: { "content-type": "application/json", origin: ORIGIN } }));

  it("is restricted to the owner", async () => {
    expect((await send("nuevo@hoppers.com")).status).toBe(403);
  });

  it("lets the owner invite a valid email", async () => {
    state.role = "owner";
    expect((await send("not-an-email")).status).toBe(400);
    expect((await send("nuevo@hoppers.com")).status).toBe(200);
  });
});
