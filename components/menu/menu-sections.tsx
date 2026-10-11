import { priceText } from "@/lib/menu/format";
import type { Category, HappyHour, Product } from "@/lib/menu/types";
import { CategoryArt, Leaf } from "./art";
import { BeerCard, ProductCard, ProductRow } from "./product-items";

export type Notices = { alcohol: string; salt: string };
type SelectHandler = (product: Product, category: Category, trigger: HTMLElement) => void;

/** Splits products into consecutive runs that share the same `group` sub-heading. */
function groupRuns(items: Product[]): { group: string; items: Product[] }[] {
  const runs: { group: string; items: Product[] }[] = [];
  for (const item of items) {
    const last = runs.at(-1);
    if (last && last.group === item.group) last.items.push(item);
    else runs.push({ group: item.group, items: [item] });
  }
  return runs;
}

export function CategorySection({ category, anchor, index, notices, onSelect }: {
  category: Category; anchor: string; index: number; notices: Notices; onSelect: SelectHandler;
}) {
  const select = (product: Product, trigger: HTMLElement) => onSelect(product, category, trigger);
  const Item = category.layout === "beer" ? BeerCard : category.layout === "list" ? ProductRow : ProductCard;
  const notice = category.notice === "alcohol" ? notices.alcohol : category.notice === "salt" ? notices.salt : "";
  const headingId = `${anchor}-title`;

  return (
    <section id={anchor} className={`menu-section tone-${category.tone} layout-${category.layout}`} aria-labelledby={headingId} data-nav-section>
      <header className="section-head">
        <span className="section-index" aria-hidden="true">{String(index).padStart(2, "0")}</span>
        <h2 id={headingId} className="section-title">{category.name}</h2>
        <CategoryArt icon={category.icon} className="section-art" />
      </header>
      {category.note && <p className="section-note">{category.note}</p>}

      {category.priceList.length > 0 && (
        <div className="price-board" aria-label={`Precios de ${category.name}`}>
          <p className="price-board-title">Medidas</p>
          <ul>
            {category.priceList.map(entry => (
              <li key={entry.id}><span>{entry.label}</span><strong>{priceText(entry)}</strong></li>
            ))}
          </ul>
        </div>
      )}

      {groupRuns(category.items).map((run, runIndex) => (
        <div key={`${run.group}-${runIndex}`} className="group">
          {run.group && <h3 className="group-title">{run.group}</h3>}
          <ul className="items" role="list">
            {run.items.map(product => <Item key={product.id} product={product} category={category} onSelect={select} />)}
          </ul>
        </div>
      ))}

      {notice && <p className="section-notice">{notice}</p>}
    </section>
  );
}

export function HappyHourSection({ happyHour, anchor, notice }: { happyHour: HappyHour; anchor: string; notice: string }) {
  return (
    <section id={anchor} className="menu-section happy-hour" aria-labelledby={`${anchor}-title`} data-nav-section>
      <div className="hh-card">
        <Leaf className="hh-leaf" />
        <div className="hh-head">
          <h2 id={`${anchor}-title`} className="hh-title">{happyHour.title}</h2>
          <div className="hh-tags">
            {happyHour.schedule && <span className="hh-chip">{happyHour.schedule}</span>}
            {happyHour.payment && <span className="hh-chip hh-chip-red">{happyHour.payment}</span>}
          </div>
        </div>
        {happyHour.description && <p className="hh-desc">{happyHour.description}</p>}
        {happyHour.items.length > 0 && (
          <ul className="hh-list">
            {happyHour.items.map(entry => (
              <li key={entry.id}>
                <span>{entry.label}</span>
                <span className="row-leader" aria-hidden="true" />
                <strong className={entry.price === null ? "hh-stamp" : undefined}>{priceText(entry)}</strong>
              </li>
            ))}
          </ul>
        )}
        {notice && <p className="section-notice">{notice}</p>}
      </div>
    </section>
  );
}
