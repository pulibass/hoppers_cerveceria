import { describe, expect, it } from "vitest";
import { parsePriceInput, parseTags, moveItem } from "@/lib/menu/mutations";
import { safeNextPath } from "@/lib/safe-path";
import { isSameOrigin, readJsonBody } from "@/lib/server/http";
import { checkImage, detectImageType } from "@/lib/server/image";
import { decideOwnerBootstrap } from "@/lib/server/owner";

const bytes = (...values: number[]) => new Uint8Array(values);
const ascii = (text: string) => Array.from(text, char => char.charCodeAt(0));

const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0, 0, 0x10);
const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0);
const WEBP = bytes(...ascii("RIFF"), 0x10, 0, 0, 0, ...ascii("WEBPVP8 "));
const AVIF = bytes(0, 0, 0, 0x1c, ...ascii("ftypavif"), 0, 0, 0, 0, ...ascii("avifmif1miaf"));
const HTML = bytes(...ascii("<html><script>"));

describe("image validation", () => {
  it("detects JPEG, PNG, WebP and AVIF from magic bytes", () => {
    expect(detectImageType(JPEG)).toBe("image/jpeg");
    expect(detectImageType(PNG)).toBe("image/png");
    expect(detectImageType(WEBP)).toBe("image/webp");
    expect(detectImageType(AVIF)).toBe("image/avif");
    expect(detectImageType(HTML)).toBeNull();
  });

  it("rejects spoofed files, unsupported types and oversized images", () => {
    expect(checkImage("image/png", 1000, HTML)).toMatchObject({ ok: false, status: 415 });
    expect(checkImage("image/gif", 1000, JPEG)).toMatchObject({ ok: false, status: 415 });
    expect(checkImage("image/jpeg", 4 * 1024 * 1024 + 1, JPEG)).toMatchObject({ ok: false, status: 413 });
    expect(checkImage("image/jpeg", 0, JPEG)).toMatchObject({ ok: false });
  });

  it("uses the detected type, not the declared one", () => {
    expect(checkImage("image/jpeg", 1000, PNG)).toEqual({ ok: true, type: "image/png", extension: "png" });
  });
});

describe("request helpers", () => {
  it("blocks cross-site requests", () => {
    const same = new Request("https://carta.example/api/menu", { method: "PUT", headers: { origin: "https://carta.example", "sec-fetch-site": "same-origin" } });
    const cross = new Request("https://carta.example/api/menu", { method: "PUT", headers: { origin: "https://evil.example" } });
    const crossSite = new Request("https://carta.example/api/menu", { method: "PUT", headers: { "sec-fetch-site": "cross-site" } });
    expect(isSameOrigin(same)).toBe(true);
    expect(isSameOrigin(cross)).toBe(false);
    expect(isSameOrigin(crossSite)).toBe(false);
  });

  it("enforces JSON content type and size", async () => {
    const wrongType = await readJsonBody(new Request("https://x.test", { method: "POST", body: "{}", headers: { "content-type": "text/plain" } }), 100);
    expect(wrongType.ok ? 0 : wrongType.response.status).toBe(415);
    const tooBig = await readJsonBody(new Request("https://x.test", { method: "POST", body: JSON.stringify({ a: "x".repeat(200) }), headers: { "content-type": "application/json" } }), 100);
    expect(tooBig.ok ? 0 : tooBig.response.status).toBe(413);
    const bad = await readJsonBody(new Request("https://x.test", { method: "POST", body: "{nope", headers: { "content-type": "application/json" } }), 100);
    expect(bad.ok ? 0 : bad.response.status).toBe(400);
    const good = await readJsonBody(new Request("https://x.test", { method: "POST", body: '{"a":1}', headers: { "content-type": "application/json" } }), 100);
    expect(good.ok && good.value).toEqual({ a: 1 });
  });

  it("only allows same-site redirect targets", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("//evil.com")).toBe("/admin/password");
    expect(safeNextPath("https://evil.com")).toBe("/admin/password");
    expect(safeNextPath("/\\evil.com")).toBe("/admin/password");
    expect(safeNextPath(null)).toBe("/admin/password");
  });
});

describe("owner bootstrap", () => {
  const base = { email: "Duenio@Hoppers.com", ownerEmail: " duenio@hoppers.com ", currentRole: null, ownerExists: false } as const;

  it("registers OWNER_EMAIL as owner on first login (case-insensitive)", () => {
    expect(decideOwnerBootstrap(base)).toBe("create-owner");
  });

  it("never creates a second owner", () => {
    expect(decideOwnerBootstrap({ ...base, ownerExists: true })).toBe("deny");
  });

  it("denies unknown accounts and when OWNER_EMAIL is not configured", () => {
    expect(decideOwnerBootstrap({ ...base, email: "otro@hoppers.com" })).toBe("deny");
    expect(decideOwnerBootstrap({ ...base, ownerEmail: undefined })).toBe("deny");
    expect(decideOwnerBootstrap({ ...base, ownerEmail: "" })).toBe("deny");
  });

  it("keeps editors and promotes OWNER_EMAIL only while there is no owner", () => {
    expect(decideOwnerBootstrap({ ...base, email: "editor@hoppers.com", currentRole: "editor" })).toBe("keep");
    expect(decideOwnerBootstrap({ ...base, currentRole: "editor" })).toBe("promote-to-owner");
    expect(decideOwnerBootstrap({ ...base, currentRole: "editor", ownerExists: true })).toBe("keep");
    expect(decideOwnerBootstrap({ ...base, currentRole: "owner", ownerExists: true })).toBe("keep");
  });
});

describe("editor helpers", () => {
  it("parses prices typed with thousands separators", () => {
    expect(parsePriceInput("14.000")).toBe(14000);
    expect(parsePriceInput("$ 6.500")).toBe(6500);
    expect(parsePriceInput("")).toBeNull();
  });

  it("parses tags and reorders lists", () => {
    expect(parseTags("Vegana, sin gluten, vegana,  ")).toEqual(["Vegana", "sin gluten"]);
    expect(moveItem(["a", "b", "c"], 0, 1)).toEqual(["b", "a", "c"]);
    expect(moveItem(["a", "b"], 0, -1)).toEqual(["a", "b"]);
  });
});
