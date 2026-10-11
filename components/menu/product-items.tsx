/* eslint-disable @next/next/no-img-element -- product photos come from Supabase Storage URLs edited at runtime */
import { beerSummary, priceText } from "@/lib/menu/format";
import { beerSwatch } from "@/lib/menu/public-view";
import type { Category, Product } from "@/lib/menu/types";
import { CategoryArt } from "./art";

type ItemProps = { product: Product; category: Category; onSelect: (product: Product, trigger: HTMLElement) => void };

function Price({ product }: { product: Product }) {
  const text = priceText(product);
  return text ? <span className="price">{text}</span> : null;
}

function Unavailable({ product }: { product: Product }) {
  return product.available ? null : <span className="badge badge-off">No disponible</span>;
}

/** Product with photo (or illustrated fallback), used for food categories. */
export function ProductCard({ product, category, onSelect }: ItemProps) {
  return (
    <li>
      <button
        type="button"
        className={`product-card${product.imageUrl ? " has-photo" : ""}${product.available ? "" : " is-off"}`}
        onClick={event => onSelect(product, event.currentTarget)}
        aria-haspopup="dialog"
      >
        <span className="product-card-text">
          <span className="product-name">{product.name}</span>
          {product.description && <span className="product-desc">{product.description}</span>}
          <span className="product-meta">
            <Price product={product} />
            {product.tags.map(tag => <span key={tag} className="badge">{tag}</span>)}
            <Unavailable product={product} />
          </span>
        </span>
        <span className={`product-thumb tone-${category.tone}`}>
          {product.imageUrl
            ? <img src={product.imageUrl} alt="" loading="lazy" decoding="async" />
            : <CategoryArt icon={category.icon} className="thumb-art" />}
        </span>
      </button>
    </li>
  );
}

/** Compact editorial row with dotted leader, used for drinks. */
export function ProductRow({ product, category, onSelect }: ItemProps) {
  return (
    <li>
      <button
        type="button"
        className={`product-row${product.available ? "" : " is-off"}`}
        onClick={event => onSelect(product, event.currentTarget)}
        aria-haspopup="dialog"
      >
        {product.imageUrl && (
          <span className={`row-thumb tone-${category.tone}`}><img src={product.imageUrl} alt="" loading="lazy" decoding="async" /></span>
        )}
        <span className="row-main">
          <span className="row-line">
            <span className="product-name">{product.name}</span>
            <span className="row-leader" aria-hidden="true" />
            <Price product={product} />
          </span>
          {(product.description || product.tags.length > 0 || !product.available) && (
            <span className="row-sub">
              {product.description && <span className="product-desc">{product.description}</span>}
              {product.tags.map(tag => <span key={tag} className="badge">{tag}</span>)}
              <Unavailable product={product} />
            </span>
          )}
        </span>
      </button>
    </li>
  );
}

/** Beer style card: name, brewery and a short ABV/IBU line. Full sheet lives in the dialog. */
export function BeerCard({ product, onSelect }: ItemProps) {
  const beer = product.beer;
  return (
    <li>
      <button
        type="button"
        className={`beer-card${product.available ? "" : " is-off"}`}
        onClick={event => onSelect(product, event.currentTarget)}
        aria-haspopup="dialog"
      >
        {product.imageUrl
          ? <span className="beer-photo"><img src={product.imageUrl} alt="" loading="lazy" decoding="async" /></span>
          : <span className="beer-glass" style={{ "--beer": beerSwatch(beer?.color ?? "") } as React.CSSProperties} aria-hidden="true" />}
        <span className="beer-text">
          <span className="beer-name">{product.name}</span>
          {beer && <span className="beer-summary">{beerSummary(beer)}</span>}
          {beer?.aroma && <span className="beer-aroma">{beer.aroma}</span>}
          <span className="product-meta">
            <Price product={product} />
            {product.tags.map(tag => <span key={tag} className="badge">{tag}</span>)}
            <Unavailable product={product} />
          </span>
        </span>
      </button>
    </li>
  );
}
