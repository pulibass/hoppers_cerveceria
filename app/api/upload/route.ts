import { MAX_IMAGE_BYTES } from "@/lib/menu/limits";
import { guardAdminRequest } from "@/lib/server/admin-auth";
import { errorResponse, json } from "@/lib/server/http";
import { checkImage } from "@/lib/server/image";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BUCKET = "product-images";
// Multipart envelope overhead on top of the 4 MB image. Vercel Functions accept up to 4.5 MB.
const MAX_BODY_BYTES = MAX_IMAGE_BYTES + 64 * 1024;

export async function POST(request: Request) {
  const guard = await guardAdminRequest(request);
  if (!guard.ok) return guard.response;
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > MAX_BODY_BYTES) return errorResponse("La imagen no puede superar 4 MB.", 413);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    return errorResponse("Formato de solicitud no admitido.", 415);
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("image");
  } catch {
    return errorResponse("No se pudo leer el archivo enviado.", 400);
  }
  if (!(file instanceof File)) return errorResponse("Elegí una imagen.", 400);

  const bytes = new Uint8Array(await file.arrayBuffer());
  const check = checkImage(file.type, bytes.byteLength, bytes.subarray(0, 64));
  if (!check.ok) return errorResponse(check.error, check.status);

  const path = `products/${crypto.randomUUID()}.${check.extension}`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: check.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) return errorResponse("No se pudo guardar la imagen. Revisá que el bucket product-images exista.", 502);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return json({ url: data.publicUrl });
}
