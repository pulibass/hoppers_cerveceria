"use client";

import { useState } from "react";
import { priceText } from "@/lib/menu/format";
import { createCategory, createProduct, moveItem, parseTags } from "@/lib/menu/mutations";
import {
  CATEGORY_ICONS, type BeerInfo, type Category, type CategoryIcon, type CategoryLayout, type CategoryNotice,
  type CategoryTone, type MenuData, type Product,
} from "@/lib/menu/types";
import { useConfirm } from "./confirm";
import { DecimalField, PriceField, SelectField, TagsField, TextArea, TextField, Toggle } from "./fields";
import { ImageField } from "./image-field";
import { PriceEntriesEditor } from "./price-entries-editor";

export type Status = { type: "ok" | "error"; text: string };
type Updater = (mutate: (draft: MenuData) => void) => void;

const LAYOUTS: { value: CategoryLayout; label: string }[] = [
  { value: "cards", label: "Tarjetas con foto (comidas)" },
  { value: "list", label: "Lista compacta (bebidas)" },
  { value: "beer", label: "Cervezas con ficha técnica" },
];
const TONES: { value: CategoryTone; label: string }[] = [
  { value: "verde", label: "Verde" }, { value: "rojo", label: "Rojo" }, { value: "ambar", label: "Ámbar" }, { value: "grafito", label: "Grafito" },
];
const NOTICES: { value: CategoryNotice; label: string }[] = [
  { value: "none", label: "Sin aviso" }, { value: "alcohol", label: "Aviso de alcohol" }, { value: "salt", label: "Aviso de sal (Ley 14.349)" },
];
const ICON_LABELS: Record<CategoryIcon, string> = {
  glass: "Vaso", gin: "Gin", whisky: "Whisky", wine: "Copa de vino", beer: "Chopp", bottle: "Botella", cocktail: "Cocktail",
  fries: "Papas", snack: "Para picar", pizza: "Pizza", burger: "Burger", leaf: "Hoja", sandwich: "Sándwich", dessert: "Postre", plus: "Genérico",
};
const ICONS = CATEGORY_ICONS.map(value => ({ value, label: ICON_LABELS[value] }));
const EMPTY_BEER: BeerInfo = { brewery: "", color: "", aroma: "", finish: "", abv: null, ibu: null };

export function MenuEditor({ menu, update, onStatus }: { menu: MenuData; update: Updater; onStatus: (status: Status) => void }) {
  const confirm = useConfirm();
  const [openCategory, setOpenCategory] = useState<string | null>(null);
  const [settingsFor, setSettingsFor] = useState<string | null>(null);
  const [openProduct, setOpenProduct] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");

  const withCategory = (categoryId: string, mutate: (category: Category) => void) =>
    update(draft => { const category = draft.categories.find(entry => entry.id === categoryId); if (category) mutate(category); });
  const withProduct = (categoryId: string, productId: string, mutate: (product: Product) => void) =>
    withCategory(categoryId, category => { const product = category.items.find(entry => entry.id === productId); if (product) mutate(product); });

  const moveCategory = (index: number, delta: -1 | 1) => update(draft => { draft.categories = moveItem(draft.categories, index, delta); });
  const moveProduct = (categoryId: string, index: number, delta: -1 | 1) => withCategory(categoryId, category => { category.items = moveItem(category.items, index, delta); });

  const deleteCategory = async (category: Category) => {
    const ok = await confirm({
      title: "Eliminar categoría",
      message: `¿Eliminar “${category.name}” y sus ${category.items.length} productos? Se quita de la carta cuando guardes. Si solo querés ocultarla, usá “Visible en la carta”.`,
      confirmLabel: "Eliminar categoría",
      danger: true,
    });
    if (!ok) return;
    update(draft => {
      draft.categories = draft.categories.filter(entry => entry.id !== category.id);
      if (draft.happyHour.afterCategoryId === category.id) draft.happyHour.afterCategoryId = "";
    });
    onStatus({ type: "ok", text: `Categoría “${category.name}” eliminada. Guardá para publicar.` });
  };

  const deleteProduct = async (category: Category, product: Product) => {
    const ok = await confirm({
      title: "Eliminar producto",
      message: `¿Eliminar “${product.name}” de ${category.name}? Si solo no hay stock, marcalo como no disponible.`,
      confirmLabel: "Eliminar producto",
      danger: true,
    });
    if (!ok) return;
    withCategory(category.id, entry => { entry.items = entry.items.filter(item => item.id !== product.id); });
    onStatus({ type: "ok", text: `“${product.name}” eliminado. Guardá para publicar.` });
  };

  const addProduct = (category: Category) => {
    const product = createProduct(category);
    withCategory(category.id, entry => { entry.items.push(product); });
    setOpenProduct(product.id);
  };

  const moveProductToCategory = (fromId: string, productId: string, toId: string) => update(draft => {
    const from = draft.categories.find(entry => entry.id === fromId);
    const to = draft.categories.find(entry => entry.id === toId);
    const index = from?.items.findIndex(item => item.id === productId) ?? -1;
    if (!from || !to || index === -1) return;
    const [product] = from.items.splice(index, 1);
    if (product) to.items.push(product);
  });

  const addCategory = () => {
    const category = createCategory(newCategoryName.trim());
    update(draft => { draft.categories.push(category); });
    setNewCategoryName("");
    setOpenCategory(category.id);
    setSettingsFor(category.id);
  };

  return (
    <div className="stack">
      <p className="muted">Tocá una categoría para ver sus productos. Los cambios se publican al presionar <strong>Guardar cambios</strong>.</p>
      {menu.categories.map((category, categoryIndex) => {
        const open = openCategory === category.id;
        const hiddenCount = category.items.filter(item => !item.visible).length;
        return (
          <section key={category.id} className={`card category-card ${open ? "is-open" : ""}`}>
            <div className="category-bar">
              <button type="button" className="category-toggle" aria-expanded={open} onClick={() => setOpenCategory(open ? null : category.id)}>
                <span className="chevron" aria-hidden="true">{open ? "▾" : "▸"}</span>
                <span className="category-name">{category.name}</span>
                <span className="muted small">{category.items.length} productos{hiddenCount ? ` · ${hiddenCount} ocultos` : ""}</span>
                {!category.visible && <span className="tag tag-warn">Oculta</span>}
              </button>
              <div className="row-actions">
                <button type="button" className="icon-btn" onClick={() => moveCategory(categoryIndex, -1)} disabled={categoryIndex === 0} aria-label={`Subir ${category.name}`}>↑</button>
                <button type="button" className="icon-btn" onClick={() => moveCategory(categoryIndex, 1)} disabled={categoryIndex === menu.categories.length - 1} aria-label={`Bajar ${category.name}`}>↓</button>
              </div>
            </div>

            {open && (
              <div className="category-body">
                <div className="toolbar">
                  <Toggle label="Visible en la carta" checked={category.visible} onChange={visible => withCategory(category.id, entry => { entry.visible = visible; })} />
                  <button type="button" className="btn btn-ghost" aria-expanded={settingsFor === category.id} onClick={() => setSettingsFor(settingsFor === category.id ? null : category.id)}>
                    {settingsFor === category.id ? "Cerrar ajustes de categoría" : "Ajustes de categoría"}
                  </button>
                  <button type="button" className="btn btn-danger-ghost" onClick={() => void deleteCategory(category)}>Eliminar categoría</button>
                </div>

                {settingsFor === category.id && (
                  <div className="subcard">
                    <div className="grid-2">
                      <TextField label="Nombre" value={category.name} maxLength={120} onChange={name => withCategory(category.id, entry => { entry.name = name; })} required />
                      <SelectField label="Formato" value={category.layout} options={LAYOUTS} onChange={layout => withCategory(category.id, entry => { entry.layout = layout; })} />
                      <TextArea className="span-2" label="Nota de la categoría" hint="Opcional. Ej.: Todas incluyen papas bastón." rows={2} value={category.note} maxLength={1000} onChange={note => withCategory(category.id, entry => { entry.note = note; })} />
                      <SelectField label="Color de acento" value={category.tone} options={TONES} onChange={tone => withCategory(category.id, entry => { entry.tone = tone; })} />
                      <SelectField label="Ilustración (cuando no hay foto)" value={category.icon} options={ICONS} onChange={icon => withCategory(category.id, entry => { entry.icon = icon; })} />
                      <SelectField label="Aviso legal al final" value={category.notice} options={NOTICES} onChange={notice => withCategory(category.id, entry => { entry.notice = notice; })} />
                    </div>
                    <h4 className="subhead">Precios generales de la categoría</h4>
                    <p className="muted small">Para medidas que valen para toda la categoría (pinta, media pinta…). No se asocian a un producto.</p>
                    <PriceEntriesEditor entries={category.priceList} prefix={category.id} addLabel="Agregar precio general"
                      onChange={priceList => withCategory(category.id, entry => { entry.priceList = priceList; })} />
                  </div>
                )}

                <ul className="product-list">
                  {category.items.map((product, productIndex) => {
                    const editing = openProduct === product.id;
                    return (
                      <li key={product.id} className={`product-item ${editing ? "is-open" : ""} ${product.visible ? "" : "is-hidden"}`}>
                        <div className="product-line">
                          <div className="product-line-name">
                            <strong>{product.name || "Sin nombre"}</strong>
                            <span className="muted small">
                              {product.group && `${product.group} · `}
                              {product.visible ? "" : "Oculto · "}
                              {product.available ? "" : "No disponible · "}
                              {product.imageUrl ? "Con foto" : "Sin foto"}
                            </span>
                          </div>
                          <PriceField compact label={`Precio de ${product.name}`} value={product.price}
                            hint={product.priceLabel || (category.priceList.length ? "Usa precios generales" : undefined)}
                            onChange={price => withProduct(category.id, product.id, entry => { entry.price = price; })} />
                          <div className="row-actions">
                            <Toggle compact label="Visible" checked={product.visible} onChange={visible => withProduct(category.id, product.id, entry => { entry.visible = visible; })} />
                            <button type="button" className="btn btn-secondary btn-small" aria-expanded={editing} onClick={() => setOpenProduct(editing ? null : product.id)}>
                              {editing ? "Cerrar" : "Editar"}
                            </button>
                          </div>
                        </div>

                        {editing && (
                          <ProductForm
                            category={category}
                            categories={menu.categories}
                            product={product}
                            index={productIndex}
                            onChange={mutate => withProduct(category.id, product.id, mutate)}
                            onMove={delta => moveProduct(category.id, productIndex, delta)}
                            onMoveTo={toId => { moveProductToCategory(category.id, product.id, toId); setOpenCategory(toId); }}
                            onDelete={() => void deleteProduct(category, product)}
                            onStatus={onStatus}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
                {category.items.length === 0 && <p className="muted">Esta categoría todavía no tiene productos.</p>}
                <button type="button" className="btn btn-secondary" onClick={() => addProduct(category)}>+ Agregar producto en {category.name}</button>
              </div>
            )}
          </section>
        );
      })}

      <section className="card">
        <h3 className="card-title">Nueva categoría</h3>
        <form className="inline-form" onSubmit={event => { event.preventDefault(); addCategory(); }}>
          <TextField label="Nombre de la categoría" value={newCategoryName} maxLength={120} placeholder="Ej.: Ensaladas" onChange={setNewCategoryName} />
          <button type="submit" className="btn btn-primary" disabled={!newCategoryName.trim()}>Crear categoría</button>
        </form>
      </section>
    </div>
  );
}

function ProductForm({ category, categories, product, index, onChange, onMove, onMoveTo, onDelete, onStatus }: {
  category: Category;
  categories: Category[];
  product: Product;
  index: number;
  onChange: (mutate: (product: Product) => void) => void;
  onMove: (delta: -1 | 1) => void;
  onMoveTo: (categoryId: string) => void;
  onDelete: () => void;
  onStatus: (status: Status) => void;
}) {
  const beer = product.beer;
  const setBeer = (patch: Partial<BeerInfo>) => onChange(entry => { entry.beer = { ...(entry.beer ?? EMPTY_BEER), ...patch }; });
  const preview = priceText(product);

  return (
    <div className="product-form">
      <div className="grid-2">
        <TextField label="Nombre" value={product.name} maxLength={120} required onChange={name => onChange(entry => { entry.name = name; })} />
        <TextField label="Subgrupo" hint="Opcional. Ej.: Tintos, Blancos." value={product.group} maxLength={120} onChange={group => onChange(entry => { entry.group = group; })} />
        <TextArea className="span-2" label="Descripción" rows={3} value={product.description} maxLength={700} onChange={description => onChange(entry => { entry.description = description; })} />
        <PriceField label="Precio" hint="Vacío: no se muestra precio" value={product.price} onChange={price => onChange(entry => { entry.price = price; })} />
        <TextField label="Texto de precio" hint={`Opcional, ej. 2x1. Se verá: ${preview || "sin precio"}`} value={product.priceLabel} maxLength={40} onChange={priceLabel => onChange(entry => { entry.priceLabel = priceLabel; })} />
        <TagsField key={`${product.id}-tags`} className="span-2" label="Etiquetas" value={product.tags} onChange={text => onChange(entry => { entry.tags = parseTags(text).slice(0, 8); })} />
      </div>

      <div className="toolbar">
        <Toggle label="Visible en la carta" checked={product.visible} onChange={visible => onChange(entry => { entry.visible = visible; })} />
        <Toggle label="Disponible (con stock)" checked={product.available} onChange={available => onChange(entry => { entry.available = available; })} />
      </div>

      <ImageField value={product.imageUrl} onChange={imageUrl => onChange(entry => { entry.imageUrl = imageUrl; })} onStatus={onStatus} />

      <div className="subcard">
        <Toggle label="Mostrar ficha cervecera" checked={beer !== null} onChange={on => onChange(entry => { entry.beer = on ? (entry.beer ?? { ...EMPTY_BEER }) : null; })} />
        {beer && (
          <div className="grid-3">
            <TextField label="Cervecería" value={beer.brewery} maxLength={120} onChange={brewery => setBeer({ brewery })} />
            <TextField label="Color" value={beer.color} maxLength={160} onChange={color => setBeer({ color })} />
            <TextField label="Aroma / perfil" value={beer.aroma} maxLength={160} onChange={aroma => setBeer({ aroma })} />
            <TextField label="Sabor / final" value={beer.finish} maxLength={160} onChange={finish => setBeer({ finish })} />
            <DecimalField key={`${product.id}-abv`} label="Graduación (ABV)" suffix="%" value={beer.abv} onChange={abv => setBeer({ abv })} />
            <DecimalField key={`${product.id}-ibu`} label="IBU" integer value={beer.ibu} onChange={ibu => setBeer({ ibu })} />
          </div>
        )}
      </div>

      <div className="toolbar toolbar-end">
        <button type="button" className="btn btn-ghost" onClick={() => onMove(-1)} disabled={index === 0}>↑ Subir</button>
        <button type="button" className="btn btn-ghost" onClick={() => onMove(1)} disabled={index === category.items.length - 1}>↓ Bajar</button>
        {categories.length > 1 && (
          <SelectField
            className="move-to"
            label="Mover a otra categoría"
            value={category.id}
            options={categories.map(entry => ({ value: entry.id, label: entry.name }))}
            onChange={toId => { if (toId !== category.id) onMoveTo(toId); }}
          />
        )}
        <button type="button" className="btn btn-danger-ghost" onClick={onDelete}>Eliminar producto</button>
      </div>
    </div>
  );
}
