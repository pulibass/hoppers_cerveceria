import type { BeerInfo, PriceEntry, Product } from "./types";

const integer = new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Argentine peso format used across the menu: `$ 14.000`. */
export function formatPrice(value: number): string {
  return `$ ${integer.format(Math.round(value))}`;
}

/** Text shown for a product or price entry, or "" when it has neither price nor label. */
export function priceText(entry: Pick<Product | PriceEntry, "price" | "priceLabel">): string {
  const parts = [entry.price !== null ? formatPrice(entry.price) : "", entry.priceLabel.trim()].filter(Boolean);
  return parts.join(" · ");
}

export function formatAbv(abv: number): string {
  return `${decimal.format(abv)} %`;
}

/** Short one-line beer summary for cards, e.g. "Bier Republik · 5,0 % · IBU 17". */
export function beerSummary(beer: BeerInfo): string {
  return [beer.brewery, beer.abv !== null ? formatAbv(beer.abv) : "", beer.ibu !== null ? `IBU ${beer.ibu}` : ""]
    .filter(Boolean)
    .join(" · ");
}

export function whatsappUrl(number: string): string {
  const digits = number.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}

/** "@usuario" for an Instagram profile URL, or "" if it cannot be derived. */
export function instagramHandle(url: string): string {
  const match = /instagram\.com\/([A-Za-z0-9._]+)/i.exec(url);
  return match?.[1] ? `@${match[1]}` : "";
}
