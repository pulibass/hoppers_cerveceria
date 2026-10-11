import { LIMITS } from "./limits";

export const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

export function slugify(text: string, fallback = "item"): string {
  const slug = text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return slug || fallback;
}

/** Returns `base` or `base-2`, `base-3`… so that it is not in `taken`; adds the result to `taken`. */
export function uniqueId(base: string, taken: Set<string>): string {
  const root = (ID_PATTERN.test(base) ? base : slugify(base)).slice(0, LIMITS.idLength - 4);
  let id = root;
  for (let suffix = 2; taken.has(id); suffix++) id = `${root}-${suffix}`;
  taken.add(id);
  return id;
}

/** Random short id for elements created in the admin panel. */
export function newId(prefix: string): string {
  const random = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 10)
    : Math.random().toString(36).slice(2, 12);
  return `${slugify(prefix, "item").slice(0, 40)}-${random}`;
}
