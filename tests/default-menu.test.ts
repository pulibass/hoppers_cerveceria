import { describe, expect, it } from "vitest";
import { defaultMenu } from "@/lib/menu/default-menu";
import { validateMenu } from "@/lib/menu/schema";

const names = (id: string) => defaultMenu.categories.find(category => category.id === id)?.items.map(item => item.name) ?? [];

describe("default menu (PDF content)", () => {
  it("passes the strict save validation", () => {
    const result = validateMenu(defaultMenu);
    expect(result.ok ? "ok" : result.error).toBe("ok");
  });

  it("contains every category of the PDF in order", () => {
    expect(defaultMenu.categories.map(category => category.name)).toEqual([
      "Sin alcohol", "Gin tonic", "Whiskys", "Vinos", "Cervezas tiradas", "Cervezas en botella", "Cocktails",
      "Papas", "Para picar", "Pizzetas", "Burgers", "Libre de gluten", "Sándwiches", "Postres", "Adicionales",
    ]);
  });

  it("has the expected number of products per category", () => {
    const counts = Object.fromEntries(defaultMenu.categories.map(category => [category.id, category.items.length]));
    expect(counts).toEqual({
      "sin-alcohol": 8, "gin-tonic": 3, whiskys: 6, vinos: 12, "cervezas-tiradas": 10, "cervezas-botella": 3, cocktails: 24,
      papas: 6, "para-picar": 4, pizzetas: 6, burgers: 4, "libre-de-gluten": 1, sandwiches: 4, postres: 2, adicionales: 2,
    });
  });

  it("keeps the beer style names confirmed by the client", () => {
    expect(names("cervezas-tiradas")).toEqual(["Golden", "Stout", "Woody", "Red Scotch", "APA", "IPA", "Barley Wine", "Honey", "Red Fruit", "Vera IPA"]);
  });

  it("stores beer attributes but no per-style price (serving prices are general)", () => {
    const beers = defaultMenu.categories.find(category => category.id === "cervezas-tiradas")!;
    for (const beer of beers.items) {
      expect(beer.price).toBeNull();
      expect(beer.beer?.brewery).toBeTruthy();
      expect(beer.beer?.abv).toBeTypeOf("number");
      expect(beer.beer?.ibu).toBeTypeOf("number");
    }
    expect(beers.priceList.map(entry => [entry.label, entry.price])).toEqual([["Pinta", 6000], ["Media pinta", 3500], ["Especiales", 7000], ["Media especiales", 4000]]);
  });

  it("includes Happy Hour with schedule, payment condition and promotions", () => {
    expect(defaultMenu.happyHour.schedule).toMatch(/17 a 20/);
    expect(defaultMenu.happyHour.payment).toMatch(/efectivo/i);
    expect(defaultMenu.happyHour.items.map(entry => entry.label)).toEqual(["Pinta", "Especiales", "Fernet", "Campari", "Obrero Höppers"]);
  });

  it("does not invent address or opening hours", () => {
    expect(defaultMenu.business.address).toBe("");
    expect(defaultMenu.business.hours).toBe("");
    expect(defaultMenu.business.whatsappNumber).toBe("543518063069");
    expect(defaultMenu.business.instagramUrl).toBe("https://www.instagram.com/hoppers_cerveceria/");
  });

  it("ships without product photos (uploaded later from the panel)", () => {
    expect(defaultMenu.categories.flatMap(category => category.items).every(item => item.imageUrl === "")).toBe(true);
  });
});
