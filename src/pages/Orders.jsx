import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { dateTime, money, STATUSES, statusLabel } from "../lib/Format";
import { Badge, btn, btnGhost, Card, Field, input, statusTone } from "../components/ui";

function OrderPanel({ order, onClose, onSaved }) {
  const [status, setStatus] = useState(order.status);
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const a = order.ship_address ?? {};

  const save = async () => {
    setSaving(true);
    setError("");
    // Changing the status also adds an entry to the customer's tracking timeline (database trigger).
    const { error: err } = await supabase
      .from("orders")
      .update({ status, carrier: carrier.trim() || null, tracking_number: tracking.trim() || null })
      .eq("id", order.id);
    setSaving(false);
    if (err) return setError(err.message);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <aside className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">{order.number}</h2>
            <p className="text-sm text-slate-500">{dateTime(order.created_at)}</p>
          </div>
          <button onClick={onClose} className="text-2xl leading-none text-slate-500" aria-label="Close">×</button>
        </div>

        <div className="mt-6 space-y-6 text-sm">
          <div>
            <p className="font-medium">{order.ship_name}</p>
            <p className="text-slate-600">{order.email}</p>
            <p className="text-slate-600">{order.ship_phone}</p>
            <p className="mt-2 text-slate-600">
              {[a.address, a.apartment, a.city, a.postal, a.country].filter(Boolean).join(", ")}
            </p>
          </div>

          <ul className="divide-y divide-slate-100 border-y border-slate-100">
            {order.order_items.map((i, n) => (
              <li key={n} className="flex justify-between gap-3 py-2">
                <span>{i.name} × {i.qty}</span>
                <span>{money(i.unit_price * i.qty, order.currency_code)}</span>
              </li>
            ))}
            <li className="flex justify-between py-2 font-semibold">
              <span>Total</span>
              <span>{money(order.total, order.currency_code)}</span>
            </li>
          </ul>

          <div className="space-y-4">
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{statusLabel(s)}</option>
                ))}
              </select>
            </Field>
            <Field label="Carrier">
              <input value={carrier} onChange={(e) => setCarrier(e.target.value)} className={input} placeholder="DHL Express" />
            </Field>
            <Field label="Tracking number">
              <input value={tracking} onChange={(e) => setTracking(e.target.value)} className={input} />
            </Field>
          </div>

          {error && <p className="text-red-600">{error}</p>}
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className={btn}>{saving ? "Saving…" : "Save changes"}</button>
            <button onClick={onClose} className={btnGhost}>Cancel</button>
          </div>
        </div>
      </aside>
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("orders")
      .select("*, order_items(name, qty, unit_price)")
      .eq("payment_status", "paid") // unpaid = abandoned checkouts, hidden
      .order("created_at", { ascending: false })
      .limit(100);
    if (filter) q = q.eq("status", filter);
    const { data, error: err } = await q;
    setLoading(false);
    if (err) return setError(err.message);
    setOrders(data);
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className={`${input} !w-auto`}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600">{error}</p>}

      <Card className="overflow-x-auto !p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={5} className="px-4 py-6 text-slate-500">Loading…</td></tr>
            )}
            {!loading && orders.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-slate-500">No orders found.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id} onClick={() => setSelected(o)} className="cursor-pointer border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium">{o.number}</td>
                <td className="px-4 py-3">{o.ship_name || o.email}</td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-500">{dateTime(o.created_at)}</td>
                <td className="px-4 py-3"><Badge tone={statusTone(o.status)}>{statusLabel(o.status)}</Badge></td>
                <td className="px-4 py-3 text-right">{money(o.total, o.currency_code)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {selected && (
        <OrderPanel
          order={selected}
          onClose={() => setSelected(null)}
          onSaved={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}