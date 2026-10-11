"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authErrorMessage } from "@/lib/auth-errors";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Mode = "login" | "forgot" | "sent";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (next: Mode) => { setMode(next); setError(""); };

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
      const json = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(json.error ?? "No pudimos iniciar sesión.");
      router.replace("/admin");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos iniciar sesión.");
      setLoading(false);
    }
  };

  const requestReset = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const supabase = createBrowserSupabase();
      if (!supabase) throw new Error("La recuperación de contraseña todavía no está configurada.");
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin/password` });
      // Only surface errors that do not reveal whether the account exists.
      if (resetError && (resetError.status === 429 || resetError.code === "email_address_invalid" || !resetError.status)) {
        throw new Error(authErrorMessage(resetError, "No pudimos enviar el correo. Volvé a intentar."));
      }
      setMode("sent");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No pudimos enviar el correo. Volvé a intentar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="admin-logo">HÖPPERS</p>
        <h1 id="auth-title" className="auth-title">{mode === "login" ? "Ingresar al panel" : "Recuperar contraseña"}</h1>

        {mode === "login" && (
          <form className="stack" onSubmit={login}>
            <div className="field">
              <label htmlFor="email">Correo</label>
              <input id="email" type="email" required autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <input id="password" type="password" required autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} />
            </div>
            {error && <p className="text-error" role="alert">{error}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>{loading ? "Ingresando…" : "Ingresar"}</button>
            <button type="button" className="link-btn" onClick={() => switchMode("forgot")}>Olvidé mi contraseña</button>
          </form>
        )}

        {mode === "forgot" && (
          <form className="stack" onSubmit={requestReset}>
            <p className="muted">Te enviaremos un enlace para elegir una nueva contraseña.</p>
            <div className="field">
              <label htmlFor="reset-email">Correo</label>
              <input id="reset-email" type="email" required autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} />
            </div>
            {error && <p className="text-error" role="alert">{error}</p>}
            <button className="btn btn-primary btn-block" type="submit" disabled={loading}>{loading ? "Enviando…" : "Enviar enlace"}</button>
            <button type="button" className="link-btn" onClick={() => switchMode("login")}>Volver a ingresar</button>
          </form>
        )}

        {mode === "sent" && (
          <div className="stack">
            <p className="text-ok" role="status">
              Si <strong>{email.trim()}</strong> corresponde a una cuenta autorizada, te enviamos un correo con el enlace. Revisá también la carpeta de spam.
            </p>
            <button type="button" className="btn btn-secondary btn-block" onClick={() => switchMode("login")}>Volver a ingresar</button>
          </div>
        )}
      </section>
    </main>
  );
}
