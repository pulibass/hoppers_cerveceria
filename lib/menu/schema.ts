import { z } from "zod";
import { ID_PATTERN } from "./ids";
import { LIMITS } from "./limits";
import {
  CATEGORY_ICONS, CATEGORY_LAYOUTS, CATEGORY_NOTICES, CATEGORY_TONES, MENU_VERSION, type MenuData,
} from "./types";

// Strict validation for menu documents received from the admin panel.
// Reading is tolerant (see normalize.ts); writing must match this schema exactly.

// Control characters other than tab / newline are never valid in menu text.
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

const text = (max: number) =>
  z.string().max(max, `Máximo ${max} caracteres.`).refine(value => !CONTROL_CHARS.test(value), "Contiene caracteres no permitidos.");
const requiredText = (max: number) => text(max).refine(value => value.trim().length > 0, "No puede quedar vacío.");
const id = z.string().min(1).max(LIMITS.idLength).regex(ID_PATTERN, "Identificador inválido.");
const price = z.number().int("El precio debe ser un número entero.").min(0, "El precio no puede ser negativo.").max(LIMITS.maxPrice, "Precio demasiado alto.");

/** True for an absolute https URL without credentials, or (optionally) a same-site path like /images/x.webp. */
export function isSafeUrl(value: string, options: { allowRelative?: boolean } = {}): boolean {
  if (options.allowRelative && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

const optionalUrl = (allowRelative: boolean) =>
  z.string().max(LIMITS.url).refine(value => value === "" || isSafeUrl(value, { allowRelative }), "Usá una dirección https:// válida.");

const priceEntry = z.strictObject({
  id,
  label: requiredText(LIMITS.name),
  price: price.nullable(),
  priceLabel: text(40),
});

const beerInfo = z.strictObject({
  brewery: text(LIMITS.name),
  color: text(LIMITS.shortText),
  aroma: text(LIMITS.shortText),
  finish: text(LIMITS.shortText),
  abv: z.number().min(0).max(80).nullable(),
  ibu: z.number().int().min(0).max(200).nullable(),
});

const product = z.strictObject({
  id,
  name: requiredText(LIMITS.name),
  description: text(LIMITS.description),
  price: price.nullable(),
  priceLabel: text(40),
  group: text(LIMITS.name),
  imageUrl: optionalUrl(true),
  visible: z.boolean(),
  available: z.boolean(),
  tags: z.array(requiredText(LIMITS.tagLength)).max(LIMITS.tags, `Máximo ${LIMITS.tags} etiquetas.`),
  beer: beerInfo.nullable(),
});

const category = z.strictObject({
  id,
  name: requiredText(LIMITS.name),
  note: text(LIMITS.longText),
  visible: z.boolean(),
  layout: z.enum(CATEGORY_LAYOUTS),
  tone: z.enum(CATEGORY_TONES),
  icon: z.enum(CATEGORY_ICONS),
  notice: z.enum(CATEGORY_NOTICES),
  priceList: z.array(priceEntry).max(LIMITS.priceEntries),
  items: z.array(product).max(LIMITS.itemsPerCategory, `Máximo ${LIMITS.itemsPerCategory} productos por categoría.`),
});

const business = z.strictObject({
  name: requiredText(LIMITS.name),
  subtitle: text(LIMITS.shortText),
  description: text(LIMITS.longText),
  address: text(LIMITS.shortText),
  hours: text(LIMITS.longText),
  instagramUrl: optionalUrl(false),
  whatsappNumber: z.string().regex(/^(\d{8,15})?$/, "Usá solo números, con código de país (ej. 543518063069)."),
  whatsappDisplay: text(40),
  alcoholNotice: text(LIMITS.shortText),
  saltNotice: text(LIMITS.shortText),
  closingTitle: text(LIMITS.shortText),
  closingText: text(LIMITS.longText),
});

const happyHour = z.strictObject({
  visible: z.boolean(),
  title: requiredText(LIMITS.name),
  description: text(LIMITS.longText),
  schedule: text(LIMITS.shortText),
  payment: text(LIMITS.shortText),
  afterCategoryId: z.union([z.literal(""), id]),
  items: z.array(priceEntry).max(LIMITS.priceEntries),
});

export const menuSchema = z
  .strictObject({
    version: z.literal(MENU_VERSION),
    business,
    happyHour,
    categories: z.array(category).max(LIMITS.categories, `Máximo ${LIMITS.categories} categorías.`),
  })
  .superRefine((menu, ctx) => {
    const categoryIds = new Set<string>();
    const productIds = new Set<string>();
    let total = 0;
    menu.categories.forEach((entry, categoryIndex) => {
      if (categoryIds.has(entry.id)) ctx.addIssue({ code: "custom", path: ["categories", categoryIndex, "id"], message: "Identificador de categoría repetido." });
      categoryIds.add(entry.id);
      entry.items.forEach((item, itemIndex) => {
        total += 1;
        if (productIds.has(item.id)) ctx.addIssue({ code: "custom", path: ["categories", categoryIndex, "items", itemIndex, "id"], message: "Identificador de producto repetido." });
        productIds.add(item.id);
      });
      assertUniqueIds(entry.priceList, ["categories", categoryIndex, "priceList"], ctx);
    });
    assertUniqueIds(menu.happyHour.items, ["happyHour", "items"], ctx);
    if (total > LIMITS.totalItems) ctx.addIssue({ code: "custom", path: ["categories"], message: `La carta no puede superar ${LIMITS.totalItems} productos.` });
    if (menu.happyHour.afterCategoryId && !categoryIds.has(menu.happyHour.afterCategoryId)) {
      ctx.addIssue({ code: "custom", path: ["happyHour", "afterCategoryId"], message: "La categoría elegida para ubicar el Happy Hour no existe." });
    }
  });

function assertUniqueIds(entries: { id: string }[], path: (string | number)[], ctx: z.RefinementCtx) {
  const seen = new Set<string>();
  entries.forEach((entry, index) => {
    if (seen.has(entry.id)) ctx.addIssue({ code: "custom", path: [...path, index, "id"], message: "Identificador repetido." });
    seen.add(entry.id);
  });
}

export type ValidationResult = { ok: true; menu: MenuData } | { ok: false; error: string };

/** Validates a menu sent by the admin panel. Returns a readable Spanish error for the first problem. */
export function validateMenu(input: unknown): ValidationResult {
  const result = menuSchema.safeParse(input);
  if (result.success) return { ok: true, menu: result.data };
  const issue = result.error.issues[0];
  return { ok: false, error: issue ? `${describePath(input, issue.path)}: ${issue.message}` : "Los datos de la carta no son válidos." };
}

/** Human-friendly location for an issue, e.g. "Burgers › Americana › precio". */
function describePath(input: unknown, path: PropertyKey[]): string {
  const labels: string[] = [];
  let node: unknown = input;
  for (const key of path) {
    node = node && typeof node === "object" ? (node as Record<PropertyKey, unknown>)[key] : undefined;
    if (typeof key === "number" && node && typeof node === "object") {
      const named = node as { name?: unknown; label?: unknown };
      const label = typeof named.name === "string" ? named.name : typeof named.label === "string" ? named.label : "";
      labels.push(label.trim() || `#${key + 1}`);
    } else if (typeof key === "string" && FIELD_LABELS[key]) {
      labels.push(FIELD_LABELS[key]);
    }
  }
  return labels.length ? labels.join(" › ") : "Carta";
}

const FIELD_LABELS: Record<string, string> = {
  business: "Negocio", happyHour: "Happy Hour", name: "nombre", label: "nombre", description: "descripción",
  price: "precio", priceLabel: "texto de precio", imageUrl: "imagen", tags: "etiquetas", note: "nota",
  instagramUrl: "Instagram", whatsappNumber: "WhatsApp", subtitle: "subtítulo", address: "dirección", hours: "horarios",
  title: "título", schedule: "horario", payment: "condición de pago", abv: "graduación", ibu: "IBU", brewery: "cervecería",
  afterCategoryId: "ubicación", items: "", priceList: "precios generales", categories: "",
};
