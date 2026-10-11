"use client";
/* eslint-disable @next/next/no-img-element -- product photos come from Supabase Storage URLs edited at runtime */

import { useEffect, useRef } from "react";
import { formatAbv, priceText } from "@/lib/menu/format";
import { beerSwatch } from "@/lib/menu/public-view";
import type { Category, Product } from "@/lib/menu/types";
import { CategoryArt } from "./art";
import type { Notices } from "./menu-sections";

export type Selection = { product: Product; category: Category };

/**
 * Accessible product detail built on the native <dialog>: showModal() makes the rest of the page
 * inert and moves focus inside; Escape, the close button and a click on the backdrop close it,
 * and focus returns to the product that opened it.
 */
export function ProductDialog({ selection, notices, onClose, returnFocusTo }: {
  selection: Selection | null;
  notices: Notices;
  onClose: () => void;
  returnFocusTo: React.RefObject<HTMLElement | null>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selection && !dialog.open) {
      dialog.showModal();
      // Start keyboard navigation at the close button, not the scrollable panel.
      closeRef.current?.focus();
    }
    if (!selection && dialog.open) dialog.close();
  }, [selection]);

  const handleClose = () => {
    onClose();
    returnFocusTo.current?.focus({ preventScroll: true });
  };

  const product = selection?.product;
  const category = selection?.category;
  const beer = product?.beer;
  const price = product ? priceText(product) : "";
  const notice = category?.notice === "alcohol" ? notices.alcohol : category?.notice === "salt" ? notices.salt : "";
  const beerRows = beer
    ? ([
        ["Cervecería", beer.brewery],
        ["Color", beer.color],
        ["Aroma", beer.aroma],
        ["Sabor / final", beer.finish],
        ["Graduación alcohólica", beer.abv !== null ? formatAbv(beer.abv) : ""],
        ["IBU (amargor)", beer.ibu !== null ? String(beer.ibu) : ""],
      ] as const).filter(([, value]) => value)
    : [];

  return (
    <dialog
      ref={dialogRef}
      className="product-dialog"
      aria-labelledby="product-dialog-title"
      onClose={handleClose}
      onClick={event => { if (event.target === dialogRef.current) dialogRef.current?.close(); }}
    >
      {product && category && (
        <div className={`dialog-panel tone-${category.tone}`}>
          <button ref={closeRef} type="button" className="dialog-close" onClick={() => dialogRef.current?.close()} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
          <div className="dialog-media">
            {product.imageUrl
              ? <img src={product.imageUrl} alt={product.name} />
              : beer
                ? <span className="dialog-glass" style={{ "--beer": beerSwatch(beer.color) } as React.CSSProperties} aria-hidden="true" />
                : <CategoryArt icon={category.icon} className="dialog-art" />}
          </div>
          <div className="dialog-body">
            <p className="dialog-kicker">{[category.name, product.group].filter(Boolean).join(" · ")}</p>
            <div className="dialog-title-row">
              <h2 id="product-dialog-title" className="dialog-title">{product.name}</h2>
              {price && <p className="dialog-price">{price}</p>}
            </div>
            {!product.available && <p className="dialog-off">Momentáneamente no disponible.</p>}
            {product.description && <p className="dialog-desc">{product.description}</p>}
            {product.tags.length > 0 && (
              <ul className="dialog-tags" aria-label="Etiquetas">{product.tags.map(tag => <li key={tag} className="badge">{tag}</li>)}</ul>
            )}
            {beerRows.length > 0 && (
              <dl className="beer-sheet">
                {beerRows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
              </dl>
            )}
            {category.priceList.length > 0 && (
              <div className="dialog-prices">
                <p className="dialog-subtitle">Precios por medida</p>
                <ul>{category.priceList.map(entry => <li key={entry.id}><span>{entry.label}</span><strong>{priceText(entry)}</strong></li>)}</ul>
              </div>
            )}
            {category.note && <p className="dialog-note">{category.note}</p>}
            {notice && <p className="dialog-notice">{notice}</p>}
          </div>
        </div>
      )}
    </dialog>
  );
}
