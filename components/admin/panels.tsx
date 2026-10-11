"use client";

import { useState } from "react";
import { whatsappUrl } from "@/lib/menu/format";
import type { Business, HappyHour, MenuData } from "@/lib/menu/types";
import { useConfirm } from "./confirm";
import { PriceField, SelectField, TextArea, TextField, Toggle } from "./fields";
import type { Status } from "./menu-editor";
import { PriceEntriesEditor } from "./price-entries-editor";

type Updater = (mutate: (draft: MenuData) => void) => void;

/** Flat list of every product price, with search, for fast price updates. */
export function QuickPrices({ menu, update }: { menu: MenuData; update: Updater }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase().normalize("NFD").replace(/\p{M}/gu, "");
  const matches = (text: string) => !needle || text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").includes(needle);

  return (
    <div className="stack">
      <div className="card">
        <TextField label="Buscar producto" value={query} placeholder="Ej.: pinta, burger, malbec" onChange={setQuery} />
        <p className="muted small">Escribí el precio en pesos, sin puntos. Dejalo vacío para no mostrar precio.</p>
      </div>
      {menu.categories.map(category => {
        const items = category.items.filter(item => matches(`${item.name} ${category.name} ${item.group}`));
        if (!items.length) return null;
        return (
          <section key={category.id} className="card">
            <h3 className="card-title">{category.name}</h3>
            <ul className="quick-list">
              {items.map(item => (
                <li key={item.id}>
                  <span className="quick-name">{item.name}{item.group && <span className="muted small"> · {item.group}</span>}</span>
                  <PriceField compact label={`Precio de ${item.name}`} value={item.price} hint={item.priceLabel || undefined}
                    onChange={price => update(draft => {
                      const target = draft.categories.find(entry => entry.id === category.id)?.items.find(entry => entry.id === item.id);
                      if (target) target.price = price;
                    })} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function HappyHourForm({ menu, update }: { menu: MenuData; update: Updater }) {
  const happyHour = menu.happyHour;
  const set = (patch: Partial<HappyHour>) => update(draft => { draft.happyHour = { ...draft.happyHour, ...patch }; });
  const positions = [{ value: "", label: "Al final de la carta" }, ...menu.categories.map(category => ({ value: category.id, label: `Después de ${category.name}` }))];
  return (
    <div className="stack">
      <section className="card">
        <Toggle label="Mostrar Happy Hour en la carta" checked={happyHour.visible} onChange={visible => set({ visible })} />
        <div className="grid-2">
          <TextField label="Título" value={happyHour.title} maxLength={120} onChange={title => set({ title })} required />
          <SelectField label="Ubicación en la carta" value={happyHour.afterCategoryId} options={positions} onChange={afterCategoryId => set({ afterCategoryId })} />
          <TextField label="Días y horario" value={happyHour.schedule} maxLength={160} placeholder="Todos los días de 17 a 20 h" onChange={schedule => set({ schedule })} />
          <TextField label="Condición de pago" value={happyHour.payment} maxLength={160} placeholder="Solo en efectivo" onChange={payment => set({ payment })} />
          <TextArea className="span-2" label="Texto adicional" hint="Opcional." rows={2} value={happyHour.description} maxLength={1000} onChange={description => set({ description })} />
        </div>
      </section>
      <section className="card">
        <h3 className="card-title">Precios y promociones</h3>
        <PriceEntriesEditor entries={happyHour.items} prefix="happy-hour" addLabel="Agregar promoción" onChange={items => set({ items })} />
      </section>
    </div>
  );
}

export function BusinessForm({ menu, update }: { menu: MenuData; update: Updater }) {
  const business = menu.business;
  const set = (patch: Partial<Business>) => update(draft => { draft.business = { ...draft.business, ...patch }; });
  const wa = whatsappUrl(business.whatsappNumber);
  return (
    <div className="stack">
      <section className="card">
        <h3 className="card-title">Marca</h3>
        <div className="grid-2">
          <TextField label="Nombre" value={business.name} maxLength={120} required onChange={name => set({ name })} />
          <TextField label="Subtítulo" value={business.subtitle} maxLength={160} onChange={subtitle => set({ subtitle })} />
          <TextArea className="span-2" label="Frase de bienvenida" rows={2} value={business.description} maxLength={1000} onChange={description => set({ description })} />
        </div>
      </section>
      <section className="card">
        <h3 className="card-title">Local</h3>
        <p className="muted small">Si dejás la dirección o los horarios vacíos, no se muestran en la carta.</p>
        <div className="grid-2">
          <TextField label="Dirección" value={business.address} maxLength={160} onChange={address => set({ address })} />
          <TextArea label="Horarios" rows={3} value={business.hours} maxLength={1000} placeholder={"Mar a dom · 19 a 2 h"} onChange={hours => set({ hours })} />
        </div>
      </section>
      <section className="card">
        <h3 className="card-title">Contacto y redes</h3>
        <div className="grid-2">
          <TextField label="WhatsApp (solo números, con código de país)" value={business.whatsappNumber} maxLength={15}
            hint={wa ? `Enlace: ${wa}` : "Ej.: 543518063069"} onChange={value => set({ whatsappNumber: value.replace(/\D/g, "") })} />
          <TextField label="WhatsApp como se muestra" value={business.whatsappDisplay} maxLength={40} placeholder="351 806-3069" onChange={whatsappDisplay => set({ whatsappDisplay })} />
          <TextField className="span-2" type="url" label="Instagram (URL completa)" value={business.instagramUrl} maxLength={600}
            placeholder="https://www.instagram.com/hoppers_cerveceria/" onChange={instagramUrl => set({ instagramUrl: instagramUrl.trim() })} />
          <TextField label="Título de cierre" value={business.closingTitle} maxLength={160} onChange={closingTitle => set({ closingTitle })} />
          <TextArea label="Texto de cierre" rows={3} value={business.closingText} maxLength={1000} onChange={closingText => set({ closingText })} />
        </div>
      </section>
      <section className="card">
        <h3 className="card-title">Avisos legales</h3>
        <div className="grid-2">
          <TextField label="Aviso de bebidas alcohólicas" value={business.alcoholNotice} maxLength={160} onChange={alcoholNotice => set({ alcoholNotice })} />
          <TextField label="Aviso de sal" value={business.saltNotice} maxLength={160} onChange={saltNotice => set({ saltNotice })} />
        </div>
      </section>
    </div>
  );
}

export type AdminMember = { userId: string; email: string; role: "owner" | "editor" };

export function TeamPanel({ admins, currentUserId, onChange, onStatus }: {
  admins: AdminMember[]; currentUserId: string; onChange: (admins: AdminMember[]) => void; onStatus: (status: Status) => void;
}) {
  const confirm = useConfirm();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/admin/team", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
      const json = (await response.json().catch(() => ({}))) as { error?: string; admins?: AdminMember[]; invited?: boolean };
      if (!response.ok) throw new Error(json.error ?? "No se pudo sumar al editor.");
      if (json.admins) onChange(json.admins);
      setEmail("");
      onStatus({ type: "ok", text: json.invited ? "Invitación enviada. La persona recibirá un correo para crear su contraseña." : "Esa cuenta ya existía: ahora tiene acceso como editor." });
    } catch (error) {
      onStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo sumar al editor." });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (member: AdminMember) => {
    const ok = await confirm({ title: "Quitar acceso", message: `¿Quitar el acceso de ${member.email} al panel? Su cuenta no se borra, pero ya no podrá editar la carta.`, confirmLabel: "Quitar acceso", danger: true });
    if (!ok) return;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/team", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: member.userId }) });
      const json = (await response.json().catch(() => ({}))) as { error?: string; admins?: AdminMember[] };
      if (!response.ok) throw new Error(json.error ?? "No se pudo quitar el acceso.");
      if (json.admins) onChange(json.admins);
      onStatus({ type: "ok", text: `${member.email} ya no tiene acceso.` });
    } catch (error) {
      onStatus({ type: "error", text: error instanceof Error ? error.message : "No se pudo quitar el acceso." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack">
      <section className="card">
        <h3 className="card-title">Invitar editor</h3>
        <p className="muted small">Los editores pueden cambiar la carta, precios, fotos y datos del local. Solo vos podés administrar el equipo.</p>
        <form className="inline-form" onSubmit={invite}>
          <TextField type="email" label="Correo del editor" value={email} maxLength={254} placeholder="nombre@ejemplo.com" onChange={setEmail} required />
          <button type="submit" className="btn btn-primary" disabled={busy || !email.trim()}>{busy ? "Enviando…" : "Enviar invitación"}</button>
        </form>
      </section>
      <section className="card">
        <h3 className="card-title">Personas con acceso</h3>
        <ul className="team-list">
          {admins.map(member => (
            <li key={member.userId}>
              <span className="team-email">{member.email}{member.userId === currentUserId && <span className="muted small"> (vos)</span>}</span>
              <span className={`tag ${member.role === "owner" ? "tag-owner" : ""}`}>{member.role === "owner" ? "Propietario" : "Editor"}</span>
              {member.role === "editor" && (
                <button type="button" className="btn btn-danger-ghost btn-small" onClick={() => void remove(member)} disabled={busy}>Quitar acceso</button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
