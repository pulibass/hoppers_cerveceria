import { newId } from "./ids";
import type { Category, PriceEntry, Product } from "./types";

// Pure helpers used by the admin editor to build new elements and reorder lists.

export function moveItem<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item as T);
  return next;
}

export function createProduct(category: Pick<Category, "id" | "layout">): Product {
  return {
    id: newId(category.id),
    name: "Nuevo producto",
    description: "",
    price: null,
    priceLabel: "",
    group: "",
    imageUrl: "",
    visible: true,
    available: true,
    tags: [],
    beer: category.layout === "beer" ? { brewery: "", color: "", aroma: "", finish: "", abv: null, ibu: null } : null,
  };
}

export function createCategory(name: string): Category {
  return {
    id: newId(name || "categoria"),
    name: name || "Nueva categoría",
    note: "",
    visible: true,
    layout: "cards",
    tone: "grafito",
    icon: "plus",
    notice: "none",
    priceList: [],
    items: [],
  };
}

export function createPriceEntry(prefix: string): PriceEntry {
  return { id: newId(prefix), label: "Nuevo precio", price: null, priceLabel: "" };
}

/** Parses the text of a price input: digits only ("14.000" → 14000), "" → null. */
export function parsePriceInput(value: string): number | null {
  const digits = value.replace(/\D/g, "");
  return digits ? Math.min(Number(digits), 100_000_000) : null;
}

/** Parses a decimal input such as "5,5" or "5.5" → 5.5, "" → null. */
export function parseDecimalInput(value: string): number | null {
  const normalized = value.replace(",", ".").replace(/[^\d.]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

/** "Vegana, Sin gluten" → ["Vegana", "Sin gluten"] (trimmed, de-duplicated). */
export function parseTags(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(",")
    .map(tag => tag.trim())
    .filter(tag => tag && !seen.has(tag.toLowerCase()) && seen.add(tag.toLowerCase()));
}
