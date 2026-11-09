import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { dateTime, money, statusLabel } from "../lib/Format";
import { Badge, Card, statusTone } from "../components/ui";

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    Promise.all([
      supabase.from("orders").select("id,total,created_at,status,currency_code").eq("payment_status", "paid").gte("created_at", since),
      supabase.from("products").select("id,name,stock").eq("is_active", true).lte("stock", 5).order("stock").limit(8),
      supabase.from("orders").select("number,email,total,currency_code,status,created_at").eq("payment_status", "paid").order("created_at", { ascending: false }).limit(8),
    ]).then(([paid, low, recent]) => {
      const failed = paid.error ?? low.error ?? recent.error;
      if (failed) return setError(failed.message);
      setData({ paid: paid.data, low: low.data, recent: recent.data });
    });
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-slate-500">Loading…</p>;

  const code = data.paid[0]?.currency_code ?? "USD";
  const today = data.paid.filter((o) => new Date(o.created_at).getTime() >= startOfToday());
  const sum = (list) => list.reduce((s, o) => s + Number(o.total), 0);
  const toShip = data.paid.filter((o) => ["placed", "processing"].includes(o.status)).length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Sales today" value={money(sum(today), code)} hint={`${today.length} orders`} />
        <Stat label="Last 30 days" value={money(sum(data.paid), code)} hint={`${data.paid.length} orders`} />
        <Stat label="To ship" value={toShip} hint="Placed or processing" />
        <Stat label="Low stock" value={data.low.length} hint="5 or fewer left" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card title="Recent orders">
          {data.recent.length === 0 ? (
            <p className="text-sm text-slate-500">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.recent.map((o) => (
                <li key={o.number} className="flex items-center justify-between gap-3 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">{o.number}</p>
                    <p className="truncate text-xs text-slate-500">{o.email} · {dateTime(o.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={statusTone(o.status)}>{statusLabel(o.status)}</Badge>
                    <span className="w-20 text-right">{money(o.total, o.currency_code)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Link to="/orders" className="mt-4 inline-block text-sm font-medium underline">All orders</Link>
        </Card>

        <Card title="Running low">
          {data.low.length === 0 ? (
            <p className="text-sm text-slate-500">Everything is well stocked.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.low.map((p) => (
                <li key={p.id} className="flex justify-between gap-3 py-3 text-sm">
                  <span className="truncate">{p.name}</span>
                  <Badge tone={p.stock === 0 ? "red" : "amber"}>{p.stock === 0 ? "Out" : `${p.stock} left`}</Badge>
                </li>
              ))}
            </ul>
          )}
          <Link to="/products" className="mt-4 inline-block text-sm font-medium underline">Manage products</Link>
        </Card>
      </div>
    </div>
  );
}