"use client";
/* eslint-disable @next/next/no-img-element -- previews of Supabase Storage URLs */

import { useRef, useState } from "react";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/menu/limits";

type Props = {
  value: string;
  onChange: (url: string) => void;
  onStatus: (status: { type: "ok" | "error"; text: string }) => void;
};

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("image", file);
  const response = await fetch("/api/upload", { method: "POST", body: form });
  if (response.status === 413) throw new Error("La imagen no puede superar 4 MB.");
  const json = (await response.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!response.ok || !json.url) throw new Error(json.error ?? "No se pudo subir la imagen.");
  return json.url;
}

/** Upload / replace / remove a product photo. The URL is published when the menu is saved. */
export function ImageField({ value, onChange, onStatus }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      onStatus({ type: "error", text: "Usá una imagen JPG, PNG, WebP o AVIF." });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      onStatus({ type: "error", text: "La foto no puede superar 4 MB. Reducila o exportala en WebP o JPG." });
      return;
    }
    setUploading(true);
    try {
      onChange(await uploadImage(file));
      onStatus({ type: "ok", text: "Foto cargada. Guardá los cambios para publicarla en la carta." });
    } catch (error) {
      onStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo subir la foto." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="field image-field">
      <span className="field-label">Foto</span>
      <div className="image-row">
        <div className="image-preview">{value ? <img src={value} alt="Vista previa de la foto" /> : <span>Sin foto</span>}</div>
        <div className="image-actions">
          <button type="button" className="btn btn-secondary" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? "Subiendo…" : value ? "Reemplazar foto" : "Subir foto"}
          </button>
          <input ref={inputRef} type="file" hidden tabIndex={-1} accept={ALLOWED_IMAGE_TYPES.join(",")} disabled={uploading}
            onChange={event => { void handleFile(event.target.files?.[0]); event.target.value = ""; }} />
          {value && <button type="button" className="btn btn-ghost" onClick={() => onChange("")} disabled={uploading}>Quitar foto</button>}
          <p className="field-hint">JPG, PNG, WebP o AVIF, hasta 4 MB. Ideal: cuadrada o 4:3, mínimo 1000 px.</p>
        </div>
      </div>
    </div>
  );
}
