import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { uploadImage } from "../lib/uploadImage";
import { dateTime, slugify } from "../lib/format";
import { Badge, btn, btnGhost, Card, Field, input } from "./ui";

/*
  One list + one side form for any Supabase table. Each screen is just a config:

  table, title, pk ("id" by default), select, order: { column, ascending },
  columns: [{ key, label, render?(row) }]
  fields:  [{ key, label, type, required?, createOnly?, options?, optionsFrom?, autoSlugFrom?, hint? }]
           types: text (default), textarea, number, select, checkbox, datetime, json, image, display
  defaults: values for new rows, canCreate, canDelete, renderExtra(row)
  Define configs at module level (outside components) so they stay stable.
*/

const pad = (n) => String(n).padStart(2, "0");
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const isIso = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v);

function toForm(fields, source = {}) {
  const out = {};
  for (const f of fields) {
    const v = source[f.key];
    if (f.type === "checkbox") out[f.key] = Boolean(v);
    else if (f.type === "json") out[f.key] = v === undefined ? "" : JSON.stringify(v);
    else if (f.type === "datetime") out[f.key] = toLocalInput(v);
    else out[f.key] = v ?? "";
  }
  return out;
}

function toPayload(fields, form, editing) {
  const out = {};
  for (const f of fields) {
    if (f.type === "display" || (editing && f.createOnly)) continue;
    let v = form[f.key];
    if (f.type === "checkbox") v = Boolean(v);
    else if (f.type === "number") v = v === "" ? null : Number(v);
    else if (f.type === "datetime") v = v ? new Date(v).toISOString() : null;
    else if (f.type === "json") {
      try {
        v = JSON.parse(v);
      } catch {
        throw new Error(`${f.label} must be valid JSON, for example 50 or "some text" (with quotes).`);
      }
    } else {
      v = typeof v === "string" ? v.trim() : v;
      if (v === "") v = null;
    }
    if (f.autoSlugFrom && !v) v = slugify(form[f.autoSlugFrom] ?? "");
    if (f.required && (v === null || v === "")) throw new Error(`${f.label} is required.`);
    out[f.key] = v;
  }
  return out;
}

export const cell = (value) => {
  if (typeof value === "boolean") return <Badge tone={value ? "green" : "slate"}>{value ? "Yes" : "No"}</Badge>;
  if (value === null || value === undefined || value === "") return <span className="text-slate-400">—</span>;
  if (isIso(value)) return dateTime(value);
  return String(value);
};

function ImageField({ value, onChange, onError }) {
  const [busy, setBusy] = useState(false);
  const pick = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    try {
      onChange((await uploadImage(file)).url);
    } catch (err) {
      onError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex items-start gap-3">
      {value ? <img src={value} alt="" className="h-16 w-16 rounded border border-slate-200 object-cover" /> : <div className="h-16 w-16 rounded bg-slate-100" />}
      <div className="min-w-0 flex-1 space-y-2">
        <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Paste a link or upload" className={input} />
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick} disabled={busy} className="text-xs" />
        {busy && <p className="text-xs text-slate-500">Uploading…</p>}
      </div>
    </div>
  );
}

function Panel({ config, row, options, onClose, onSaved }) {
  const { table, pk = "id", fields, defaults = {}, canDelete, renderExtra } = config;
  const editing = Boolean(row);
  const [form, setForm] = useState(() => toForm(fields, { ...defaults, ...row }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const save = async (e) => {
    e.preventDefault();
    setError("");
    let payload;
    try {
      payload = toPayload(fields, form, editing);
    } catch (err) {
      return setError(err.message);
    }
    setSaving(true);
    const res = editing
      ? await supabase.from(table).update(payload).eq(pk, row[pk])
      : await supabase.from(table).insert({ ...defaults, ...payload });
    setSaving(false);
    if (res.error) return setError(res.error.message);
    onSaved();
  };

  const remove = async () => {
    if (!window.confirm("Delete this? This can't be undone.")) return;
    const { error: err } = await supabase.from(table).delete().eq(pk, row[pk]);
    if (err) return setError(err.message);
    onSaved();
  };

  const control = (f) => {
    const value = form[f.key];
    const locked = editing && f.createOnly;
    switch (f.type) {
      case "textarea":
        return <textarea rows={3} value={value} onChange={(e) => set(f.key, e.target.value)} className={input} />;
      case "json":
        return <textarea rows={2} value={value} onChange={(e) => set(f.key, e.target.value)} className={`${input} font-mono`} />;
      case "number":
        return <input type="number" step="any" value={value} disabled={locked} onChange={(e) => set(f.key, e.target.value)} className={input} />;
      case "datetime":
        return <input type="datetime-local" value={value} onChange={(e) => set(f.key, e.target.value)} className={input} />;
      case "checkbox":
        return (
          <span className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={value} onChange={(e) => set(f.key, e.target.checked)} /> {f.checkLabel ?? "Yes"}
          </span>
        );
      case "select": {
        const list = (f.options ?? options[f.key] ?? []).map((o) => (typeof o === "string" ? { value: o, label: o } : o));
        return (
          <select value={value} onChange={(e) => set(f.key, e.target.value)} className={input}>
            <option value="">{f.required ? "Choose…" : "None"}</option>
            {list.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        );
      }
      case "image":
        return <ImageField value={value} onChange={(v) => set(f.key, v)} onError={setError} />;
      case "display": {
        const shown = row?.[f.key] ?? f.placeholder ?? "—";
        return <p className="whitespace-pre-wrap rounded bg-slate-50 p-2 text-sm">{isIso(shown) ? dateTime(shown) : String(shown)}</p>;
      }
      default:
        return <input value={value} disabled={locked} onChange={(e) => set(f.key, e.target.value)} placeholder={f.autoSlugFrom ? "auto" : ""} className={input} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <form onSubmit={save} onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-lg space-y-5 overflow-y-auto bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editing ? `Edit ${config.singular ?? "item"}` : `New ${config.singular ?? "item"}`}</h2>
          <button type="button" onClick={onClose} className="text-2xl leading-none text-slate-500" aria-label="Close">×</button>
        </div>

        {editing && renderExtra?.(row)}

        {fields.map((f) => (
          <Field key={f.key} as={["checkbox", "image", "display"].includes(f.type) ? "div" : "label"} label={f.label}>
            {control(f)}
            {f.hint && <span className="mt-1 block text-xs text-slate-500">{f.hint}</span>}
          </Field>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className={btn}>{saving ? "Saving…" : "Save"}</button>
          <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
          {editing && canDelete && (
            <button type="button" onClick={remove} className="ml-auto text-sm text-red-600 hover:underline">Delete</button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function ResourceManager({ config }) {
  const { table, title, pk = "id", select = "*", order, columns, fields, canCreate = true, singular = "item" } = config;
  const [rows, setRows] = useState([]);
  const [options, setOptions] = useState({});
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, row = edit
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase.from(table).select(select).limit(500);
    if (order) q = q.order(order.column, { ascending: order.ascending ?? true });
    const { data, error: err } = await q;
    setLoading(false);
    if (err) return setError(err.message);
    setError("");
    setRows(data);
  }, [table, select, order]);

  useEffect(() => {
    load();
  }, [load]);

  // Dropdowns that read from another table (for example a product type's category)
  useEffect(() => {
    fields.filter((f) => f.optionsFrom).forEach(async (f) => {
      const { table: t, value = "id", label = "name" } = f.optionsFrom;
      const { data } = await supabase.from(t).select(`${value}, ${label}`).order(label);
      setOptions((o) => ({ ...o, [f.key]: (data ?? []).map((r) => ({ value: r[value], label: r[label] })) }));
    });
  }, [fields]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        {title && <h2 className="text-lg font-semibold">{title}</h2>}
        {canCreate && <button onClick={() => setEditing(null)} className={`${btn} ml-auto`}>New {singular}</button>}
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <Card className="overflow-x-auto !p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>{columns.map((c) => <th key={c.key} className="px-4 py-3">{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={columns.length} className="px-4 py-6 text-slate-500">Loading…</td></tr>}
            {!loading && rows.length === 0 && <tr><td colSpan={columns.length} className="px-4 py-6 text-slate-500">Nothing here yet.</td></tr>}
            {rows.map((row) => (
              <tr key={row[pk]} onClick={() => setEditing(row)} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3">{c.render ? c.render(row) : cell(row[c.key])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {editing !== undefined && (
        <Panel
          key={editing?.[pk] ?? "new"}
          config={config}
          row={editing}
          options={options}
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