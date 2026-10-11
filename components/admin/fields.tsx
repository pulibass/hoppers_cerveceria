"use client";

import { useId, useState } from "react";
import { formatPrice } from "@/lib/menu/format";
import { parseDecimalInput, parsePriceInput } from "@/lib/menu/mutations";

// Small form controls for the admin panel. Labels are always visible and associated.

type Base = { label: string; hint?: string; className?: string };

export function TextField({ label, hint, className, value, onChange, maxLength, placeholder, type = "text", required }: Base & {
  value: string; onChange: (value: string) => void; maxLength?: number; placeholder?: string; type?: "text" | "email" | "url" | "tel"; required?: boolean;
}) {
  const id = useId();
  return (
    <div className={`field ${className ?? ""}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} value={value} maxLength={maxLength} placeholder={placeholder} required={required}
        onChange={event => onChange(event.target.value)} aria-describedby={hint ? `${id}-hint` : undefined} />
      {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
    </div>
  );
}

export function TextArea({ label, hint, className, value, onChange, maxLength, placeholder, rows = 3 }: Base & {
  value: string; onChange: (value: string) => void; maxLength?: number; placeholder?: string; rows?: number;
}) {
  const id = useId();
  return (
    <div className={`field ${className ?? ""}`}>
      <label htmlFor={id}>{label}</label>
      <textarea id={id} value={value} maxLength={maxLength} placeholder={placeholder} rows={rows}
        onChange={event => onChange(event.target.value)} aria-describedby={hint ? `${id}-hint` : undefined} />
      {hint && <p id={`${id}-hint`} className="field-hint">{hint}</p>}
    </div>
  );
}

/** Whole-peso price. Empty means "no price" (null). */
export function PriceField({ label, hint, className, value, onChange, compact }: Base & {
  value: number | null; onChange: (value: number | null) => void; compact?: boolean;
}) {
  const id = useId();
  return (
    <div className={`field price-field ${compact ? "is-compact" : ""} ${className ?? ""}`}>
      <label htmlFor={id} className={compact ? "sr-only" : undefined}>{label}</label>
      <div className="price-input">
        <span aria-hidden="true">$</span>
        <input id={id} inputMode="numeric" autoComplete="off" value={value === null ? "" : String(value)} placeholder="Sin precio"
          onChange={event => onChange(parsePriceInput(event.target.value))} aria-describedby={`${id}-preview`} />
      </div>
      <p id={`${id}-preview`} className="field-hint">{value === null ? (hint ?? "Sin precio visible") : formatPrice(value)}</p>
    </div>
  );
}

/** Decimal number (e.g. ABV "5,5"). Keeps the typed text and commits the parsed value on blur. */
export function DecimalField({ label, value, onChange, suffix, className, integer }: Base & {
  value: number | null; onChange: (value: number | null) => void; suffix?: string; integer?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState(value === null ? "" : String(value).replace(".", ","));
  const commit = () => {
    const parsed = parseDecimalInput(text);
    const next = parsed === null ? null : integer ? Math.round(parsed) : Math.round(parsed * 10) / 10;
    onChange(next);
    setText(next === null ? "" : String(next).replace(".", ","));
  };
  return (
    <div className={`field ${className ?? ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="suffix-input">
        <input id={id} inputMode="decimal" value={text} onChange={event => setText(event.target.value)} onBlur={commit} />
        {suffix && <span aria-hidden="true">{suffix}</span>}
      </div>
    </div>
  );
}

/** Comma separated tags, committed on blur. */
export function TagsField({ label, value, onChange, className }: Base & { value: string[]; onChange: (value: string) => void }) {
  const id = useId();
  const [text, setText] = useState(value.join(", "));
  return (
    <div className={`field ${className ?? ""}`}>
      <label htmlFor={id}>{label}</label>
      <input id={id} value={text} placeholder="Ej.: Vegana, Sin gluten" onChange={event => setText(event.target.value)} onBlur={() => onChange(text)} />
      <p className="field-hint">Separadas por coma. Máximo 8.</p>
    </div>
  );
}

export function SelectField<T extends string>({ label, value, onChange, options, className, hint }: Base & {
  value: T; onChange: (value: T) => void; options: readonly { value: T; label: string }[];
}) {
  const id = useId();
  return (
    <div className={`field ${className ?? ""}`}>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={event => onChange(event.target.value as T)}>
        {options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export function Toggle({ label, checked, onChange, compact }: { label: string; checked: boolean; onChange: (checked: boolean) => void; compact?: boolean }) {
  return (
    <label className={`toggle ${compact ? "is-compact" : ""}`}>
      <input type="checkbox" role="switch" checked={checked} onChange={event => onChange(event.target.checked)} />
      <span className="toggle-track" aria-hidden="true"><span /></span>
      <span className={compact ? "toggle-label-compact" : undefined}>{label}</span>
    </label>
  );
}
