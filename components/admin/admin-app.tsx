"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { validateMenu } from "@/lib/menu/schema";
import type { MenuData } from "@/lib/menu/types";
import { ConfirmProvider, useConfirm } from "./confirm";
import { MenuEditor, type Status } from "./menu-editor";
import { BusinessForm, HappyHourForm, QuickPrices, TeamPanel, type AdminMember } from "./panels";

type Tab = "menu" | "prices" | "happy" | "business" | "team" | "account";

export type AdminAppProps = {
  email: string;
  userId: string;
  role: "owner" | "editor";
  initialMenu: MenuData;
  initialUpdatedAt: string | null;
  initialAdmins: AdminMember[];
};

export function AdminApp(props: AdminAppProps) {
  return <ConfirmProvider><AdminWorkspace {...props} /></ConfirmProvider>;
}

function AdminWorkspace({ email, userId, role, initialMenu, initialUpdatedAt, initialAdmins }: AdminAppProps) {
  const confirm = useConfirm();
  const [menu, setMenu] = useState(initialMenu);
  const [savedJson, setSavedJson] = useState(() => JSON.stringify(initialMenu));
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [admins, setAdmins] = useState(initialAdmins);
  const [tab, setTab] = useState<Tab>("menu");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [conflict, setConflict] = useState(false);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dirty = useMemo(() => JSON.stringify(menu) !== savedJson, [menu, savedJson]);

  const showStatus = useCallback((next: Status) => {
    setStatus(next);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    // Success messages fade; errors stay until the next action.
    if (next.type === "ok") statusTimer.current = setTimeout(() => setStatus(null), 6000);
  }, []);

  const update = useCallback((mutate: (draft: MenuData) => void) => {
    setMenu(current => {
      const draft = structuredClone(current);
      mutate(draft);
      return draft;
    });
  }, []);

  // Warn before leaving the page with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const save = async () => {
    // Snapshot: edits made while the request is in flight stay marked as unsaved.
    const snapshot = menu;
    const result = validateMenu(snapshot);
    if (!result.ok) { showStatus({ type: "error", text: `Revisá: ${result.error}` }); return; }
    setSaving(true);
    try {
      const response = await fetch("/api/menu", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ menu: result.menu, baseUpdatedAt: updatedAt }),
      });
      const json = (await response.json().catch(() => ({}))) as { error?: string; updatedAt?: string };
      if (response.status === 409) { setConflict(true); throw new Error(json.error ?? "Otra persona guardó cambios."); }
      if (response.status === 401) throw new Error("Tu sesión expiró. Abrí /admin/login en otra pestaña, ingresá y volvé a guardar (no cierres esta).");
      if (!response.ok || !json.updatedAt) throw new Error(json.error ?? "No se pudieron guardar los cambios.");
      setUpdatedAt(json.updatedAt);
      setSavedJson(JSON.stringify(snapshot));
      setConflict(false);
      showStatus({ type: "ok", text: "Cambios publicados en la carta." });
    } catch (error) {
      showStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudieron guardar los cambios." });
    } finally {
      setSaving(false);
    }
  };

  const reload = async () => {
    if (dirty) {
      const ok = await confirm({ title: "Recargar carta", message: "Vas a perder los cambios que no guardaste. ¿Recargar la versión publicada?", confirmLabel: "Recargar y descartar", danger: true });
      if (!ok) return;
    }
    try {
      const response = await fetch("/api/menu", { cache: "no-store" });
      const json = (await response.json().catch(() => ({}))) as { menu?: MenuData; updatedAt?: string | null; error?: string };
      if (!response.ok || !json.menu) throw new Error(json.error ?? "No se pudo recargar la carta.");
      setMenu(json.menu);
      setSavedJson(JSON.stringify(json.menu));
      setUpdatedAt(json.updatedAt ?? null);
      setConflict(false);
      showStatus({ type: "ok", text: "Carta recargada con la versión publicada." });
    } catch (error) {
      showStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo recargar la carta." });
    }
  };

  const discard = async () => {
    const ok = await confirm({ title: "Descartar cambios", message: "¿Descartar todos los cambios sin guardar?", confirmLabel: "Descartar", danger: true });
    if (ok) { setMenu(JSON.parse(savedJson) as MenuData); showStatus({ type: "ok", text: "Cambios descartados." }); }
  };

  const logout = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!dirty) return;
    event.preventDefault();
    const form = event.currentTarget;
    const ok = await confirm({ title: "Salir sin guardar", message: "Tenés cambios sin guardar. ¿Salir igual?", confirmLabel: "Salir sin guardar", danger: true });
    if (ok) { setSavedJson(JSON.stringify(menu)); setTimeout(() => form.submit(), 0); }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "menu", label: "Carta" },
    { id: "prices", label: "Precios rápidos" },
    { id: "happy", label: "Happy Hour" },
    { id: "business", label: "Negocio" },
    ...(role === "owner" ? [{ id: "team" as const, label: "Equipo" }] : []),
    { id: "account", label: "Cuenta" },
  ];

  const onTabKey = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    if (!next) return;
    setTab(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  return (
    <div className="admin-shell">
      <header className="admin-top">
        <div className="admin-brand">
          <span className="admin-logo">HÖPPERS</span>
          <span className="muted small">Panel de la carta · {email}</span>
        </div>
        <div className="admin-top-actions">
          <a className="btn btn-ghost" href="/" target="_blank" rel="noopener noreferrer">Ver carta ↗</a>
          <form action="/api/auth/logout" method="post" onSubmit={logout}>
            <button type="submit" className="btn btn-ghost">Salir</button>
          </form>
        </div>
      </header>

      <nav className="admin-tabs" role="tablist" aria-label="Secciones del panel">
        {tabs.map((entry, index) => (
          <button key={entry.id} id={`tab-${entry.id}`} type="button" role="tab" aria-selected={tab === entry.id} aria-controls="admin-panel"
            tabIndex={tab === entry.id ? 0 : -1} className={tab === entry.id ? "is-active" : undefined}
            onClick={() => setTab(entry.id)} onKeyDown={event => onTabKey(event, index)}>
            {entry.label}
          </button>
        ))}
      </nav>

      <main id="admin-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="admin-main">
        {tab === "menu" && <MenuEditor menu={menu} update={update} onStatus={showStatus} />}
        {tab === "prices" && <QuickPrices menu={menu} update={update} />}
        {tab === "happy" && <HappyHourForm menu={menu} update={update} />}
        {tab === "business" && <BusinessForm menu={menu} update={update} />}
        {tab === "team" && role === "owner" && <TeamPanel admins={admins} currentUserId={userId} onChange={setAdmins} onStatus={showStatus} />}
        {tab === "account" && (
          <section className="card">
            <h3 className="card-title">Tu cuenta</h3>
            <p>Ingresaste como <strong>{email}</strong> ({role === "owner" ? "propietario" : "editor"}).</p>
            <div className="toolbar">
              <a className="btn btn-secondary" href="/admin/password">Cambiar contraseña</a>
              <button type="button" className="btn btn-ghost" onClick={() => void reload()}>Recargar la carta publicada</button>
            </div>
          </section>
        )}
      </main>

      <div className={`save-bar ${dirty ? "is-dirty" : ""}`}>
        <div className="save-status" role="status" aria-live="polite">
          {status
            ? <span className={status.type === "ok" ? "text-ok" : "text-error"}>{status.text}</span>
            : <span className="muted">{dirty ? "Tenés cambios sin guardar." : "Todo guardado."}</span>}
          {conflict && <button type="button" className="btn btn-secondary btn-small" onClick={() => void reload()}>Recargar versión actual</button>}
        </div>
        <div className="save-actions">
          {dirty && <button type="button" className="btn btn-ghost" onClick={() => void discard()} disabled={saving}>Descartar</button>}
          <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving || !dirty}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}
