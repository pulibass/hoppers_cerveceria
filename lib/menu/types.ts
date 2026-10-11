// Shape of the editable menu document stored in public.site_content (id = 'menu').
// Every list element carries a stable `id`; array order is the display order.

export const MENU_VERSION = 1;

/** How a category is laid out on the public menu. */
export const CATEGORY_LAYOUTS = ["cards", "list", "beer"] as const;
/** Accent color used by the category heading and image fallbacks. */
export const CATEGORY_TONES = ["verde", "rojo", "ambar", "grafito"] as const;
/** Drawing used when a product has no photo. */
export const CATEGORY_ICONS = [
  "glass", "gin", "whisky", "wine", "beer", "bottle", "cocktail", "fries",
  "snack", "pizza", "burger", "leaf", "sandwich", "dessert", "plus",
] as const;
/** Legal notice printed at the end of a category. */
export const CATEGORY_NOTICES = ["none", "alcohol", "salt"] as const;

export type CategoryLayout = (typeof CATEGORY_LAYOUTS)[number];
export type CategoryTone = (typeof CATEGORY_TONES)[number];
export type CategoryIcon = (typeof CATEGORY_ICONS)[number];
export type CategoryNotice = (typeof CATEGORY_NOTICES)[number];

/** A label with a price, e.g. "Pinta · $ 6.000" or "Obrero Höppers · 2x1". */
export type PriceEntry = {
  id: string;
  label: string;
  /** Whole pesos. `null` when the entry has no numeric price (see `priceLabel`). */
  price: number | null;
  /** Free text shown instead of / next to the price, e.g. "2x1". */
  priceLabel: string;
};

export type BeerInfo = {
  brewery: string;
  color: string;
  aroma: string;
  finish: string;
  /** Alcohol by volume, in percent (5.5 = 5,5 %). */
  abv: number | null;
  ibu: number | null;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  /** Whole pesos. `null` hides the price (e.g. beer styles priced by serving size). */
  price: number | null;
  priceLabel: string;
  /** Optional sub-heading inside the category, e.g. "Tintos". */
  group: string;
  imageUrl: string;
  /** Hidden products are not rendered on the public menu. */
  visible: boolean;
  /** Unavailable products stay listed but are marked as out of stock. */
  available: boolean;
  tags: string[];
  beer: BeerInfo | null;
};

export type Category = {
  id: string;
  name: string;
  note: string;
  visible: boolean;
  layout: CategoryLayout;
  tone: CategoryTone;
  icon: CategoryIcon;
  notice: CategoryNotice;
  /** General prices for the whole category (e.g. pint / half pint). Not tied to a product. */
  priceList: PriceEntry[];
  items: Product[];
};

export type HappyHour = {
  visible: boolean;
  title: string;
  description: string;
  schedule: string;
  payment: string;
  /** The Happy Hour block is rendered right after this category ("" = after all categories). */
  afterCategoryId: string;
  items: PriceEntry[];
};

export type Business = {
  name: string;
  subtitle: string;
  description: string;
  address: string;
  hours: string;
  instagramUrl: string;
  /** Digits only, international format without "+", e.g. 543518063069. */
  whatsappNumber: string;
  whatsappDisplay: string;
  alcoholNotice: string;
  saltNotice: string;
  closingTitle: string;
  closingText: string;
};

export type MenuData = {
  version: number;
  business: Business;
  happyHour: HappyHour;
  categories: Category[];
};
