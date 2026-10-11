import { slugify, uniqueId } from "./ids";
import { LIMITS } from "./limits";
import { isSafeUrl } from "./schema";
import {
  CATEGORY_ICONS, CATEGORY_LAYOUTS, CATEGORY_NOTICES, CATEGORY_TONES, MENU_VERSION,
  type BeerInfo, type Business, type Category, type HappyHour, type MenuData, type PriceEntry, type Product,
} from "./types";

// Tolerant reader: turns any stored document (older versions, missing optional fields,
// partially broken entries) into a complete MenuData so the public menu never crashes.
// Invalid entries are dropped, missing fields get defaults and ids are made unique.

type Loose = Record<string, unknown>;

const isObject = (value: unknown): value is Loose => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const str = (value: unknown, max: number, fallback = ""): string => (typeof value === "string" ? value.slice(0, max) : fallback);
const bool = (value: unknown, fallback: boolean): boolean => (typeof value === "boolean" ? value : fallback);
const oneOf = <T extends string>(options: readonly T[], value: unknown, fallback: T): T =>
  options.includes(value as T) ? (value as T) : fallback;
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

function num(value: unknown, { min = 0, max = Number.MAX_SAFE_INTEGER, integer = false } = {}): number | null {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value.replace(",", ".")) : NaN;
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return integer ? Math.round(parsed) : parsed;
}

const price = (value: unknown) => num(value, { max: LIMITS.maxPrice, integer: true });
const url = (value: unknown) => {
  const candidate = str(value, LIMITS.url).trim();
  return candidate && isSafeUrl(candidate, { allowRelative: true }) ? candidate : "";
};

function normalizePriceEntries(value: unknown, prefix: string): PriceEntry[] {
  const taken = new Set<string>();
  return list(value).flatMap(raw => {
    if (!isObject(raw)) return [];
    const label = str(raw.label ?? raw.name, LIMITS.name).trim();
    if (!label) return [];
    return [{
      id: uniqueId(str(raw.id, LIMITS.idLength) || `${prefix}-${slugify(label)}`, taken),
      label,
      price: price(raw.price),
      priceLabel: str(raw.priceLabel, 40),
    }];
  }).slice(0, LIMITS.priceEntries);
}

function normalizeBeer(value: unknown): BeerInfo | null {
  if (!isObject(value)) return null;
  return {
    brewery: str(value.brewery, LIMITS.name),
    color: str(value.color, LIMITS.shortText),
    aroma: str(value.aroma, LIMITS.shortText),
    finish: str(value.finish, LIMITS.shortText),
    abv: num(value.abv, { max: 80 }),
    ibu: num(value.ibu, { max: 200, integer: true }),
  };
}

function normalizeProduct(raw: unknown, taken: Set<string>, categoryId: string): Product | null {
  if (!isObject(raw)) return null;
  const name = str(raw.name, LIMITS.name).trim();
  if (!name) return null;
  const tags = list(raw.tags)
    .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    .map(tag => tag.trim().slice(0, LIMITS.tagLength))
    .slice(0, LIMITS.tags);
  return {
    id: uniqueId(str(raw.id, LIMITS.idLength) || `${categoryId}-${slugify(name)}`, taken),
    name,
    description: str(raw.description, LIMITS.description),
    price: price(raw.price),
    priceLabel: str(raw.priceLabel, 40),
    group: str(raw.group, LIMITS.name),
    // Older documents stored a full URL in `imageKey`.
    imageUrl: url(raw.imageUrl) || url(raw.imageKey),
    visible: bool(raw.visible, true),
    available: bool(raw.available, true),
    tags,
    beer: normalizeBeer(raw.beer),
  };
}

function normalizeCategory(raw: unknown, categoryIds: Set<string>, productIds: Set<string>): Category | null {
  if (!isObject(raw)) return null;
  const name = str(raw.name, LIMITS.name).trim();
  if (!name) return null;
  const id = uniqueId(str(raw.id, LIMITS.idLength) || slugify(name, "categoria"), categoryIds);
  const items = list(raw.items)
    .map(item => normalizeProduct(item, productIds, id))
    .filter((item): item is Product => item !== null)
    .slice(0, LIMITS.itemsPerCategory);
  return {
    id,
    name,
    note: str(raw.note, LIMITS.longText),
    visible: bool(raw.visible, true),
    layout: oneOf(CATEGORY_LAYOUTS, raw.layout, items.some(item => item.beer) ? "beer" : "cards"),
    tone: oneOf(CATEGORY_TONES, raw.tone, "grafito"),
    icon: oneOf(CATEGORY_ICONS, raw.icon, "plus"),
    notice: oneOf(CATEGORY_NOTICES, raw.notice, "none"),
    priceList: normalizePriceEntries(raw.priceList, id),
    items,
  };
}

function normalizeBusiness(raw: unknown, fallback: Business): Business {
  const value = isObject(raw) ? raw : {};
  const field = (key: keyof Business, max: number) => (typeof value[key] === "string" ? str(value[key], max) : fallback[key]);
  // Older documents stored only the Instagram handle.
  const legacyHandle = typeof value.instagram === "string" ? value.instagram.replace(/^@/, "").trim() : "";
  const instagram = typeof value.instagramUrl === "string"
    ? url(value.instagramUrl)
    : legacyHandle && /^[A-Za-z0-9._]+$/.test(legacyHandle) ? `https://www.instagram.com/${legacyHandle}/` : fallback.instagramUrl;
  const whatsapp = typeof value.whatsappNumber === "string" ? value.whatsappNumber.replace(/\D/g, "").slice(0, 15) : fallback.whatsappNumber;
  return {
    name: field("name", LIMITS.name).trim() || fallback.name,
    subtitle: typeof value.subtitle === "string" ? str(value.subtitle, LIMITS.shortText) : str(value.tagline, LIMITS.shortText, fallback.subtitle),
    description: field("description", LIMITS.longText),
    address: field("address", LIMITS.shortText),
    hours: field("hours", LIMITS.longText),
    instagramUrl: instagram.startsWith("https://") ? instagram : "",
    whatsappNumber: whatsapp.length >= 8 ? whatsapp : "",
    whatsappDisplay: field("whatsappDisplay", 40),
    alcoholNotice: field("alcoholNotice", LIMITS.shortText),
    saltNotice: field("saltNotice", LIMITS.shortText),
    closingTitle: field("closingTitle", LIMITS.shortText),
    closingText: field("closingText", LIMITS.longText),
  };
}

function normalizeHappyHour(raw: unknown, fallback: HappyHour, categoryIds: Set<string>): HappyHour {
  if (!isObject(raw)) return { ...fallback, afterCategoryId: categoryIds.has(fallback.afterCategoryId) ? fallback.afterCategoryId : "" };
  const after = str(raw.afterCategoryId, LIMITS.idLength);
  return {
    visible: bool(raw.visible, true),
    title: str(raw.title, LIMITS.name).trim() || fallback.title,
    description: str(raw.description, LIMITS.longText),
    schedule: str(raw.schedule, LIMITS.shortText),
    payment: str(raw.payment, LIMITS.shortText),
    afterCategoryId: categoryIds.has(after) ? after : "",
    items: normalizePriceEntries(raw.items, "happy-hour"),
  };
}

/**
 * Converts any stored value into a complete menu. `fallback` provides the business
 * texts and Happy Hour when the stored document predates those fields.
 */
export function normalizeMenu(input: unknown, fallback: MenuData): MenuData {
  if (!isObject(input)) return fallback;
  const categoryIds = new Set<string>();
  const productIds = new Set<string>();
  const categories = list(input.categories)
    .map(raw => normalizeCategory(raw, categoryIds, productIds))
    .filter((entry): entry is Category => entry !== null)
    .slice(0, LIMITS.categories);
  return {
    version: MENU_VERSION,
    business: normalizeBusiness(input.business, fallback.business),
    happyHour: normalizeHappyHour(input.happyHour, fallback.happyHour, categoryIds),
    categories,
  };
}
