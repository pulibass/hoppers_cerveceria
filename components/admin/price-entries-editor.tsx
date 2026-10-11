"use client";

import { createPriceEntry, moveItem } from "@/lib/menu/mutations";
import type { PriceEntry } from "@/lib/menu/types";
import { useConfirm } from "./confirm";
import { PriceField, TextField } from "./fields";

/** Editable list of label + price entries (beer serving sizes, Happy Hour promotions). */
export function PriceEntriesEditor({ entries, onChange, prefix, addLabel }: {
  entries: PriceEntry[]; onChange: (entries: PriceEntry[]) => void; prefix: string; addLabel: string;
}) {
  const confirm = useConfirm();
  const update = (index: number, patch: Partial<PriceEntry>) => onChange(entries.map((entry, i) => (i === index ? { ...entry, ...patch } : entry)));
  const remove = async (index: number) => {
    const entry = entries[index];
    if (!entry) return;
    const ok = await confirm({ title: "Eliminar precio", message: `¿Eliminar “${entry.label}”? Se quita de la carta al guardar.`, confirmLabel: "Eliminar", danger: true });
    if (ok) onChange(entries.filter((_, i) => i !== index));
  };

  return (
    <div className="entries">
      {entries.length === 0 && <p className="muted">Todavía no hay precios cargados.</p>}
      {entries.map((entry, index) => (
        <div key={entry.id} className="entry-row">
          <TextField label="Nombre" value={entry.label} maxLength={120} onChange={label => update(index, { label })} />
          <PriceField label="Precio" value={entry.price} onChange={price => update(index, { price })} />
          <TextField label="Texto de precio" hint="Opcional, ej. 2x1" value={entry.priceLabel} maxLength={40} onChange={priceLabel => update(index, { priceLabel })} />
          <div className="row-actions">
            <button type="button" className="icon-btn" onClick={() => onChange(moveItem(entries, index, -1))} disabled={index === 0} aria-label={`Subir ${entry.label}`}>↑</button>
            <button type="button" className="icon-btn" onClick={() => onChange(moveItem(entries, index, 1))} disabled={index === entries.length - 1} aria-label={`Bajar ${entry.label}`}>↓</button>
            <button type="button" className="icon-btn danger" onClick={() => void remove(index)} aria-label={`Eliminar ${entry.label}`}>✕</button>
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-secondary" onClick={() => onChange([...entries, createPriceEntry(prefix)])}>+ {addLabel}</button>
    </div>
  );
}
