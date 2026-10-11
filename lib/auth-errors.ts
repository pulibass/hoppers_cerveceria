// Spanish messages for Supabase Auth errors shown in the admin screens.
const messages: Record<string, string> = {
  otp_expired: "El enlace venció o ya fue usado. Pedí uno nuevo.",
  flow_state_expired: "El enlace venció. Pedí uno nuevo.",
  flow_state_not_found: "Abrí el enlace en el mismo navegador donde lo pediste, o pedí uno nuevo.",
  bad_code_verifier: "Abrí el enlace en el mismo navegador donde lo pediste, o pedí uno nuevo.",
  access_denied: "El enlace no es válido o ya fue usado. Pedí uno nuevo.",
  invalid_link: "El enlace no es válido o ya fue usado. Pedí uno nuevo.",
  same_password: "La nueva contraseña tiene que ser distinta de la anterior.",
  weak_password: "La contraseña es muy débil. Probá con una más larga o con letras, números y símbolos.",
  session_not_found: "Tu sesión expiró. Volvé a abrir el enlace del correo.",
  over_email_send_rate_limit: "Se enviaron demasiados correos. Esperá unos minutos y volvé a intentar.",
  over_request_rate_limit: "Demasiados intentos. Esperá unos minutos y volvé a intentar.",
  email_address_invalid: "Ingresá un correo válido.",
  validation_failed: "Revisá los datos ingresados.",
  reauthentication_needed: "Por seguridad, volvé a iniciar sesión y probá de nuevo.",
};

export function authErrorMessage(error: { code?: string; message?: string; status?: number } | null | undefined, fallback: string): string {
  if (!error) return fallback;
  if (error.code && messages[error.code]) return messages[error.code]!;
  if (error.status === 429) return messages.over_request_rate_limit!;
  if (/code verifier/i.test(error.message ?? "")) return messages.bad_code_verifier!;
  if (/fetch|network/i.test(error.message ?? "")) return "No pudimos conectarnos. Revisá tu conexión y volvé a intentar.";
  return fallback;
}
