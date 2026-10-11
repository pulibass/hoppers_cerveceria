import { describe, expect, it } from "vitest";
import { defaultMenu } from "@/lib/menu/default-menu";
import { normalizeMenu } from "@/lib/menu/normalize";
import { buildPublicSections } from "@/lib/menu/public-view";
import { validateMenu } from "@/lib/menu/schema";

describe("normalizeMenu (tolerant reader)", () => {
  it("returns the default menu for non-objects", () => {
    expect(normalizeMenu(null, defaultMenu)).toBe(defaultMenu);
    expect(normalizeMenu("x", defaultMenu)).toBe(defaultMenu);
  });

  it("accepts an older document with missing optional fields", () => {
    const legacy = {
      business: { name: "HÖPPERS", tagline: "Beer experience", instagram: "@hoppers_cerveceria" },
      categories: [
        { id: "burgers", name: "Burgers", items: [{ id: "b1", name: "Höppers", price: 14000, imageKey: "https://cdn.example.com/b.jpg" }, { name: "Sin id", price: "15000" }] },
      ],
    };
    const menu = normalizeMenu(legacy, defaultMenu);
    expect(menu.business.subtitle).toBe("Beer experience");
    expect(menu.business.instagramUrl).toBe("https://www.instagram.com/hoppers_cerveceria/");
    expect(menu.business.alcoholNotice).toBe(defaultMenu.business.alcoholNotice);
    const items = menu.categories[0]!.items;
    expect(items[0]!.imageUrl).toBe("https://cdn.example.com/b.jpg");
    expect(items[1]!.id).toBe("burgers-sin-id");
    expect(items[1]!.price).toBe(15000);
    expect(items.every(item => item.visible && item.available)).toBe(true);
    expect(validateMenu(menu).ok).toBe(true);
  });

  it("drops broken entries and unsafe URLs, and makes ids unique", () => {
    const menu = normalizeMenu({
      categories: [
        { id: "a", name: "A", layout: "weird", items: [null, { name: "" }, { id: "x", name: "Uno", imageUrl: "javascript:1" }, { id: "x", name: "Dos" }] },
        { id: "a", name: "A bis", items: [] },
        "basura",
      ],
    }, defaultMenu);
    expect(menu.categories.map(category => category.id)).toEqual(["a", "a-2"]);
    const items = menu.categories[0]!.items;
    expect(items.map(item => item.id)).toEqual(["x", "x-2"]);
    expect(items[0]!.imageUrl).toBe("");
    expect(menu.categories[0]!.layout).toBe("cards");
    expect(validateMenu(menu).ok).toBe(true);
  });

  it("round-trips the default menu unchanged", () => {
    expect(normalizeMenu(structuredClone(defaultMenu), defaultMenu)).toEqual(defaultMenu);
  });
});

describe("buildPublicSections", () => {
  it("places Happy Hour after its category and numbers categories", () => {
    const sections = buildPublicSections(defaultMenu);
    const index = sections.findIndex(section => section.kind === "happyHour");
    const previous = sections[index - 1];
    expect(previous?.kind === "category" && previous.category.id).toBe("cervezas-botella");
    expect(sections.filter(section => section.kind === "category")).toHaveLength(15);
  });

  it("hides invisible categories, products and an empty Happy Hour", () => {
    const menu = structuredClone(defaultMenu);
    menu.categories[0]!.visible = false;
    menu.categories[1]!.items.forEach(item => { item.visible = false; });
    menu.categories[2]!.items[0]!.visible = false;
    menu.happyHour.visible = false;
    const sections = buildPublicSections(menu);
    const ids = sections.map(section => (section.kind === "category" ? section.category.id : "hh"));
    expect(ids).not.toContain("sin-alcohol");
    expect(ids).not.toContain("gin-tonic");
    expect(ids).not.toContain("hh");
    const whiskys = sections.find(section => section.kind === "category" && section.category.id === "whiskys");
    expect(whiskys?.kind === "category" && whiskys.category.items).toHaveLength(5);
  });
});
