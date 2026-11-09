import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { uploadImage } from "../lib/uploadImage";
import { money, slugify } from "../lib/Format";
import { Badge, btn, btnGhost, Card, Field, input } from "../components/ui";

const TEXT_FIELDS = [
  ["description", "Short line (shown on cards)"],
  ["summary", "Summary"],
  ["details", "Details"],
  ["how_to_use", "How to use"],
  ["ingredients", "Ingredients"],
];

const pad = (n) => String(n).padStart(2, "0");
const toLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// Small "+ New brand" box shown under a dropdown, so you never have to leave the form.
function QuickAdd({ label, onAdd }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setErr("");
    try {
      await onAdd(name.trim());
      setName("");
      setOpen(false);
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  };

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-1 text-xs font-medium text-blue-600 hover:underline">
        + New {label}
      </button>
    );
  }
  return (
    <div className="mt-2">
      <div className="flex gap-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={`${label} name`}
          className={`${input} !py-1`}
        />
        <button type="button" onClick={add} disabled={busy} className={btn}>Add</button>
        <button type="button" onClick={() => setOpen(false)} className={btnGhost} aria-label="Cancel">×</button>
      </div>
      {err && <p className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

const EMPTY = {
  name: "", slug: "", brand_id: "", category_id: "", type_id: "",
  price: "", compare_at_price: "", stock: 0, is_active: true,
  ships_ready: true, release_date: "", deal_ends_at: "",
  description: "", summary: "", details: "", how_to_use: "", ingredients: "", highlights: "",
};

function ProductForm({ product, lookups, onClose, onSaved, onLookupsChanged }) {
  const editing = Boolean(product);
  const [form, setForm] = useState(
    product
      ? {
          ...EMPTY,
          ...product,
          highlights: (product.highlights ?? []).join(", "),
          release_date: toLocal(product.release_date),
          deal_ends_at: toLocal(product.deal_ends_at),
        }
      : EMPTY
  );
  const [images, setImages] = useState(
    product ? [...(product.product_images ?? [])].sort((a, b) => a.position - b.position).map((i) => i.url) : []
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const types = lookups.types.filter((t) => t.category_id === form.category_id);

  const addImages = async (e) => {
    const files = [...e.target.files];
    e.target.value = "";
    setUploading(true);
    setError("");
    try {
      for (const file of files) {
        const { url } = await uploadImage(file);
        setImages((list) => [...list, url]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const move = (i, dir) =>
    setImages((list) => {
      const next = [...list];
      const j = i + dir;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const addBrand = async (name) => {
    const { data, error: err } = await supabase.from("brands").insert({ name, slug: slugify(name) }).select("id").single();
    if (err) throw err;
    await onLookupsChanged();
    setForm((f) => ({ ...f, brand_id: data.id }));
  };
  const addCategory = async (name) => {
    const { data, error: err } = await supabase.from("categories").insert({ name, slug: slugify(name) }).select("id").single();
    if (err) throw err;
    await onLookupsChanged();
    setForm((f) => ({ ...f, category_id: data.id, type_id: "" }));
  };
  const addType = async (name) => {
    if (!form.category_id) throw new Error("Choose a category first.");
    const { data, error: err } = await supabase
      .from("product_types")
      .insert({ name, slug: slugify(name), category_id: form.category_id })
      .select("id")
      .single();
    if (err) throw err;
    await onLookupsChanged();
    setForm((f) => ({ ...f, type_id: data.id }));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.brand_id || !form.category_id || form.price === "") {
      return setError("Name, brand, category and price are required.");
    }
    setSaving(true);
    setError("");

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      brand_id: form.brand_id,
      category_id: form.category_id,
      type_id: form.type_id || null,
      price: Number(form.price),
      compare_at_price: form.compare_at_price === "" ? null : Number(form.compare_at_price),
      stock: Number(form.stock) || 0,
      is_active: form.is_active,
      ships_ready: form.ships_ready,
      release_date: form.release_date ? new Date(form.release_date).toISOString() : null,
      deal_ends_at: form.deal_ends_at ? new Date(form.deal_ends_at).toISOString() : null,
      highlights: form.highlights.split(",").map((h) => h.trim()).filter(Boolean),
      ...Object.fromEntries(TEXT_FIELDS.map(([k]) => [k, form[k]?.trim() || null])),
    };

    const res = editing
      ? await supabase.from("products").update(payload).eq("id", product.id).select("id").single()
      : await supabase.from("products").insert(payload).select("id").single();
    if (res.error) {
      setSaving(false);
      return setError(res.error.message);
    }

    // Images: replace the set so order and the main photo always match what you see.
    const id = res.data.id;
    const del = await supabase.from("product_images").delete().eq("product_id", id);
    if (!del.error && images.length) {
      const ins = await supabase
        .from("product_images")
        .insert(images.map((url, i) => ({ product_id: id, url, position: i, is_primary: i === 0 })));
      if (ins.error) setError(ins.error.message);
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-xl space-y-5 overflow-y-auto bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editing ? "Edit product" : "New product"}</h2>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-500" aria-label="Close">×</button>
        </div>

        <Field label="Name">
          <input value={form.name} onChange={set("name")} className={input} />
        </Field>
        <Field label="URL name (slug)">
          <input value={form.slug} onChange={set("slug")} placeholder={slugify(form.name) || "auto"} className={input} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Field label="Brand">
              <select value={form.brand_id} onChange={set("brand_id")} className={input}>
                <option value="">Choose…</option>
                {lookups.brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </Field>
            <QuickAdd label="brand" onAdd={addBrand} />
          </div>
          <div>
            <Field label="Category">
              <select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value, type_id: "" }))} className={input}>
                <option value="">Choose…</option>
                {lookups.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <QuickAdd label="category" onAdd={addCategory} />
          </div>
          <div className="col-span-2">
            <Field label="Type">
              <select value={form.type_id} onChange={set("type_id")} className={input} disabled={!form.category_id}>
                <option value="">None</option>
                {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </Field>
            <QuickAdd label="type" onAdd={addType} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Price"><input type="number" min="0" step="0.01" value={form.price} onChange={set("price")} className={input} /></Field>
          <Field label="Was (optional)"><input type="number" min="0" step="0.01" value={form.compare_at_price ?? ""} onChange={set("compare_at_price")} className={input} /></Field>
          <Field label="Stock"><input type="number" min="0" value={form.stock} onChange={set("stock")} className={input} /></Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Deal ends (puts it in Deals)">
            <input type="datetime-local" value={form.deal_ends_at} onChange={set("deal_ends_at")} className={input} />
          </Field>
          <Field label="Release date (future = Coming soon)">
            <input type="datetime-local" value={form.release_date} onChange={set("release_date")} className={input} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.ships_ready} onChange={set("ships_ready")} /> Ready to ship
        </label>

        <Field as="div" label="Photos (first one is the main photo)">
          <div className="flex flex-wrap gap-3">
            {images.map((url, i) => (
              <div key={url} className="w-24">
                <img src={url} alt="" className="h-24 w-24 rounded-md border border-slate-200 object-cover" />
                <div className="mt-1 flex justify-between text-xs">
                  <button type="button" onClick={() => move(i, -1)} aria-label="Move left">←</button>
                  <button type="button" onClick={() => setImages((l) => l.filter((_, n) => n !== i))} className="text-red-600">Remove</button>
                  <button type="button" onClick={() => move(i, 1)} aria-label="Move right">→</button>
                </div>
              </div>
            ))}
            <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-md border border-dashed border-slate-400 text-center text-xs text-slate-500">
              {uploading ? "Uploading…" : "+ Add"}
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addImages} disabled={uploading} />
            </label>
          </div>
        </Field>

        {TEXT_FIELDS.map(([key, label]) => (
          <Field key={key} label={label}>
            <textarea rows={key === "description" ? 2 : 3} value={form[key] ?? ""} onChange={set(key)} className={input} />
          </Field>
        ))}
        <Field label="Highlights (comma separated)">
          <input value={form.highlights} onChange={set("highlights")} placeholder="Cruelty free, Sustainable packaging" className={input} />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={set("is_active")} /> Visible in the shop
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <button type="submit" disabled={saving || uploading} className={btn}>{saving ? "Saving…" : "Save product"}</button>
          <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
        </div>
      </form>
    </div>
  );
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [lookups, setLookups] = useState({ brands: [], categories: [], types: [] });
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [p, b, c, t] = await Promise.all([
      supabase.from("products").select("*, brands(name), product_images(url, position)").order("created_at", { ascending: false }).limit(300),
      supabase.from("brands").select("id,name").order("name"),
      supabase.from("categories").select("id,name").order("name"),
      supabase.from("product_types").select("id,name,category_id").order("name"),
    ]);
    setLoading(false);
    const failed = p.error ?? b.error ?? c.error ?? t.error;
    if (failed) return setError(failed.message);
    setProducts(p.data);
    setLookups({ brands: b.data, categories: c.data, types: t.data });
  }, []);

  const loadLookups = useCallback(async () => {
    const [b, c, t] = await Promise.all([
      supabase.from("brands").select("id,name").order("name"),
      supabase.from("categories").select("id,name").order("name"),
      supabase.from("product_types").select("id,name,category_id").order("name"),
    ]);
    if (!b.error && !c.error && !t.error) setLookups({ brands: b.data, categories: c.data, types: t.data });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const thumb = (p) => [...(p.product_images ?? [])].sort((a, b) => a.position - b.position)[0]?.url;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Products</h1>
        <div className="flex gap-3">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className={`${input} !w-48`} />
          <button onClick={() => setEditing(null)} className={btn}>New product</button>
        </div>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {lookups.brands.length === 0 && !loading && (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          No brands yet. You can add brands, categories and types right inside the product form, or manage them all in{" "}
          <Link to="/catalog" className="font-medium underline">Catalog</Link>.
        </p>
      )}

      <Card className="overflow-x-auto !p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Stock</th>
              <th className="px-4 py-3">Shop</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="px-4 py-6 text-slate-500">Loading…</td></tr>}
            {!loading && shown.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-slate-500">No products yet.</td></tr>}
            {shown.map((p) => (
              <tr key={p.id} onClick={() => setEditing(p)} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {thumb(p) ? (
                      <img src={thumb(p)} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-slate-100" />
                    )}
                    <span className="font-medium">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{p.brands?.name}</td>
                <td className="px-4 py-3 text-right">{money(p.price, p.currency_code)}</td>
                <td className="px-4 py-3 text-right">
                  {p.stock === 0 ? <Badge tone="red">Out</Badge> : p.stock <= 5 ? <Badge tone="amber">{p.stock}</Badge> : p.stock}
                </td>
                <td className="px-4 py-3">{p.is_active ? <Badge tone="green">Visible</Badge> : <Badge>Hidden</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {editing !== undefined && (
        <ProductForm
          product={editing}
          lookups={lookups}
          onLookupsChanged={loadLookups}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined);
            load();
          }}
        />
      )}
    </div>
  );
}