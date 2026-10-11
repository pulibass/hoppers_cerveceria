import { describe, expect, it } from "vitest";
import { defaultMenu } from "@/lib/menu/default-menu";
import { isSafeUrl, validateMenu } from "@/lib/menu/schema";
import type { MenuData } from "@/lib/menu/types";

const clone = (): MenuData => structuredClone(defaultMenu);

describe("validateMenu (server-side write validation)", () => {
  it("rejects script URLs for images and names the product", () => {
    const menu = clone();
    menu.categories[0]!.items[0]!.imageUrl = "javascript:alert(1)";
    const result = validateMenu(menu);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Gaseosa");
  });

  it("rejects unknown fields (strict objects)", () => {
    const menu = clone() as unknown as Record<string, unknown>;
    menu.extra = true;
    expect(validateMenu(menu).ok).toBe(false);
  });

  it("rejects negative, decimal and huge prices", () => {
    for (const price of [-1, 10.5, 1e12]) {
      const menu = clone();
      menu.categories[0]!.items[0]!.price = price;
      expect(validateMenu(menu).ok).toBe(false);
    }
  });

  it("rejects duplicated product ids across categories", () => {
    const menu = clone();
    menu.categories[1]!.items[0]!.id = menu.categories[0]!.items[0]!.id;
    const result = validateMenu(menu);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/repetido/);
  });

  it("rejects overly long text and empty names", () => {
    const long = clone();
    long.categories[0]!.items[0]!.description = "x".repeat(5000);
    expect(validateMenu(long).ok).toBe(false);
    const empty = clone();
    empty.categories[0]!.items[0]!.name = "   ";
    expect(validateMenu(empty).ok).toBe(false);
  });

  it("rejects a Happy Hour placed after a missing category", () => {
    const menu = clone();
    menu.happyHour.afterCategoryId = "no-existe";
    expect(validateMenu(menu).ok).toBe(false);
  });

  it("rejects invalid WhatsApp numbers and control characters", () => {
    const wa = clone();
    wa.business.whatsappNumber = "+54 351";
    expect(validateMenu(wa).ok).toBe(false);
    const ctrl = clone();
    ctrl.business.name = `HÖP${String.fromCharCode(0)}PERS`;
    expect(validateMenu(ctrl).ok).toBe(false);
  });

  it("rejects too many categories", () => {
    const menu = clone();
    menu.categories = Array.from({ length: 61 }, (_, index) => ({ ...structuredClone(defaultMenu.categories[0]!), id: `c-${index}`, items: [] }));
    menu.happyHour.afterCategoryId = "";
    expect(validateMenu(menu).ok).toBe(false);
  });

  it("accepts https URLs and same-site paths only", () => {
    expect(isSafeUrl("https://xyz.supabase.co/storage/v1/object/public/product-images/a.webp")).toBe(true);
    expect(isSafeUrl("http://example.com/a.jpg")).toBe(false);
    expect(isSafeUrl("https://user:pass@example.com/")).toBe(false);
    expect(isSafeUrl("/images/a.webp", { allowRelative: true })).toBe(true);
    expect(isSafeUrl("//evil.com/a.webp", { allowRelative: true })).toBe(false);
  });
});
