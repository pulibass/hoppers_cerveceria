"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authErrorMessage } from "@/lib/auth-errors";
import { createBrowserSupabase } from "@/lib/supabase/browser";

const MIN_LENGTH = 8;

/**
 * Create / reset / change password. Handles every link format Supabase can send:
 * - after /auth/confirm (token_hash templates): the session cookie already exists;
 * - PKCE `?code=` (must be opened in the same browser that requested it);
 * - implicit flow `#access_token=…` (default invitation template);
 * - an already signed-in admin who just wants to change the password.
 */
export default function PasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [recovery, setRecovery] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    const start = async () => {
      const supabase = createBrowserSupabase();
      if (!supabase) { setLinkError("El panel todavía no está configurado."); setReady(true); return; }
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.slice(1));
      const param = (name: string) => hash.get(name) ?? url.searchParams.get(name);
      if (param("type") === "recovery") setRecovery(true);
      const urlErrorCode = param("error_code") ?? param("error");

      unsubscribe = supabase.auth.onAuthStateChange(event => { if (event === "PASSWORD_RECOVERY") setRecovery(true); }).data.subscription.unsubscribe;
      // Initializing exchanges a PKCE `?code=` for a session.
      const { error: initError } = await supabase.auth.initialize();

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      let sessionError = accessToken ? null : url.searchParams.get("code") ? initError : null;
      if (accessToken && refreshToken) ({ error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken }));
      // Remove tokens from the address bar and history.
      if (url.search || url.hash) window.history.replaceState(null, "", window.location.pathname);

      const { data } = await supabase.auth.getUser();
      setEmail(data.user?.email ?? null);
      if (!data.user) {
        if (urlErrorCode) setLinkError(authErrorMessage({ code: urlErrorCode }, "El enlace no es válido o ya fue usado. Pedí uno nuevo."));
        else if (sessionError) setLinkError(authErrorMessage(sessionError, "No pudimos validar el enlace. Pedí uno nuevo."));
        else if (url.searchParams.get("code")) setLinkError(authErrorMessage({ code: "flow_state_not_found" }, ""));
      }
      setReady(true);
    };
    void start();
    return () => unsubscribe();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < MIN_LENGTH) { setError(`Usá al menos ${MIN_LENGTH} caracteres.`); return; }
    if (password !== confirm) { setError("Las contraseñas no coinciden."); return; }
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    setSaving(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) { setError(authErrorMessage(updateError, "No pudimos guardar la contraseña. Volvé a intentar.")); setSaving(false); return; }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("No pudimos conectarnos. Revisá tu conexión y volvé a intentar.");
      setSaving(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="admin-logo">HÖPPERS</p>
        <h1 id="auth-title" className="auth-title">{recovery ? "Restablecer contraseña" : email ? "Elegí tu contraseña" : "Contraseña"}</h1>
        {!ready ? (
          <p className="muted" role="status">Verificando enlace…</p>
        ) : !email ? (
          <div className="stack">
            <p className="text-error" role="alert">
              {linkError || "El enlace venció o ya fue usado. Pedí uno nuevo desde “Olvidé mi contraseña” o pedile al propietario una nueva invitación."}
            </p>
            <a className="btn btn-secondary btn-block" href="/admin/login">Ir al inicio de sesión</a>
          </div>
        ) : (
          <form className="stack" onSubmit={submit}>
            <p className="muted">Cuenta: {email}</p>
            <div className="field">
              <label htmlFor="new-password">Nueva contraseña</label>
              <input id="new-password" type="password" required minLength={MIN_LENGTH} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} aria-describedby="password-hint" />
              <p id="password-hint" className="field-hint">Mínimo {MIN_LENGTH} caracteres.</p>
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Repetir contraseña</label>
              <input id="confirm-password" type="password" required minLength={MIN_LENGTH} autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} />
            </div>
            {error && <p className="text-error" role="alert">{error}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar y entrar"}</button>
            <a className="link-btn" href="/admin">Volver al panel</a>
          </form>
        )}
      </section>
    </main>
  );
}
