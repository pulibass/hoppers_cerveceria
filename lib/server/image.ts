import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, type AllowedImageType } from "@/lib/menu/limits";

const EXTENSIONS: Record<AllowedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

const ascii = (bytes: Uint8Array, start: number, end: number) => String.fromCharCode(...bytes.subarray(start, end));

/** Detects the real image type from its first bytes (magic numbers), ignoring the declared MIME type. */
export function detectImageType(bytes: Uint8Array): AllowedImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value)) return "image/png";
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP") return "image/webp";
  if (bytes.length >= 16 && ascii(bytes, 4, 8) === "ftyp") {
    // ISO-BMFF: major brand at 8..12, compatible brands from 16 up to the box size.
    const boxSize = Math.min(((bytes[0]! << 24) | (bytes[1]! << 16) | (bytes[2]! << 8) | bytes[3]!) >>> 0, bytes.length, 64);
    const brands = [ascii(bytes, 8, 12)];
    for (let offset = 16; offset + 4 <= boxSize; offset += 4) brands.push(ascii(bytes, offset, offset + 4));
    if (brands.some(brand => brand === "avif" || brand === "avis")) return "image/avif";
  }
  return null;
}

export type ImageCheck = { ok: true; type: AllowedImageType; extension: string } | { ok: false; error: string; status: number };

/** Validates size, declared type and real content of an uploaded image. */
export function checkImage(declaredType: string, size: number, head: Uint8Array): ImageCheck {
  if (size <= 0) return { ok: false, error: "El archivo está vacío.", status: 400 };
  if (size > MAX_IMAGE_BYTES) return { ok: false, error: "La imagen no puede superar 4 MB.", status: 413 };
  if (declaredType && !(ALLOWED_IMAGE_TYPES as readonly string[]).includes(declaredType)) {
    return { ok: false, error: "Usá una imagen JPG, PNG, WebP o AVIF.", status: 415 };
  }
  const type = detectImageType(head);
  if (!type) return { ok: false, error: "El archivo no es una imagen JPG, PNG, WebP o AVIF válida.", status: 415 };
  return { ok: true, type, extension: EXTENSIONS[type] };
}
