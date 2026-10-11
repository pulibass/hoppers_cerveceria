// Size limits shared by the server validation and the admin form controls.
export const LIMITS = {
  /** Maximum size of the JSON body accepted by PUT /api/menu. */
  bodyBytes: 512 * 1024,
  categories: 60,
  itemsPerCategory: 150,
  totalItems: 1200,
  priceEntries: 20,
  tags: 8,
  tagLength: 30,
  idLength: 64,
  name: 120,
  shortText: 160,
  description: 700,
  longText: 1000,
  url: 600,
  maxPrice: 100_000_000,
} as const;

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];
