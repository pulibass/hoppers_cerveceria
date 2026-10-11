/** Only same-site paths are allowed as redirect targets (prevents open redirects). */
export function safeNextPath(value: string | null, fallback = "/admin/password"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
