import type { Category, HappyHour, MenuData } from "./types";

// What the public page actually renders: hidden categories/products removed and the
// Happy Hour block placed at its configured position.

export type PublicSection =
  | { kind: "category"; anchor: string; number: number; category: Category }
  | { kind: "happyHour"; anchor: string; happyHour: HappyHour };

export const HAPPY_HOUR_ANCHOR = "happy-hour";
export const categoryAnchor = (id: string) => `c-${id}`;

export function buildPublicSections(menu: MenuData): PublicSection[] {
  const categories = menu.categories
    .filter(category => category.visible)
    .map(category => ({ ...category, items: category.items.filter(item => item.visible) }))
    .filter(category => category.items.length > 0 || category.priceList.length > 0);

  const sections: PublicSection[] = categories.map((category, index) => ({ kind: "category", anchor: categoryAnchor(category.id), number: index + 1, category }));
  const happyHour = menu.happyHour;
  if (!happyHour.visible || (happyHour.items.length === 0 && !happyHour.description.trim())) return sections;

  const block: PublicSection = { kind: "happyHour", anchor: HAPPY_HOUR_ANCHOR, happyHour };
  const index = sections.findIndex(section => section.kind === "category" && section.category.id === happyHour.afterCategoryId);
  if (index === -1) sections.push(block);
  else sections.splice(index + 1, 0, block);
  return sections;
}

/** Approximate glass color for a beer, derived from the free-text color description. */
export function beerSwatch(color: string): string {
  const value = color.toLowerCase();
  if (/negr|oscur|obscur|stout|caf/.test(value)) return "#2b1a10";
  if (/rub|roj|carmes|red/.test(value)) return "#8f2a1e";
  if (/[áa]mbar|cobriz|anaranj|naranj/.test(value)) return "#c0701f";
  if (/p[áa]lid|clar|rubia/.test(value)) return "#e6c25a";
  if (/dorad|golden|miel/.test(value)) return "#d9a33a";
  return "#b98a3e";
}
