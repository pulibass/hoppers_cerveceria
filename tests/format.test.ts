import { describe, expect, it } from "vitest";
import { beerSummary, formatAbv, formatPrice, instagramHandle, priceText, whatsappUrl } from "@/lib/menu/format";

describe("format", () => {
  it("formats Argentine pesos as `$ 14.000`", () => {
    expect(formatPrice(14000)).toBe("$ 14.000");
    expect(formatPrice(500)).toBe("$ 500");
    expect(formatPrice(1250000)).toBe("$ 1.250.000");
  });

  it("combines price and price label", () => {
    expect(priceText({ price: 6000, priceLabel: "" })).toBe("$ 6.000");
    expect(priceText({ price: null, priceLabel: "2x1" })).toBe("2x1");
    expect(priceText({ price: null, priceLabel: "" })).toBe("");
  });

  it("formats beer data", () => {
    expect(formatAbv(5)).toBe("5,0 %");
    expect(beerSummary({ brewery: "Walmunz", color: "", aroma: "", finish: "", abv: 7.4, ibu: 65 })).toBe("Walmunz · 7,4 % · IBU 65");
  });

  it("builds contact links", () => {
    expect(whatsappUrl("54 351 806-3069")).toBe("https://wa.me/543518063069");
    expect(whatsappUrl("")).toBe("");
    expect(instagramHandle("https://www.instagram.com/hoppers_cerveceria/")).toBe("@hoppers_cerveceria");
  });
});
