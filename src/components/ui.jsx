// A few shared pieces so every page looks the same.
export const input =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900";
export const btn =
  "inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50";
export const btnGhost =
  "inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-100 disabled:opacity-50";

// Use as="div" when the field holds several buttons (a <label> would trigger the first one on click).
export function Field({ label, children, className = "", as: Tag = "label" }) {
  return (
    <Tag className={`block ${className}`}>
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </Tag>
  );
}

export function Card({ title, children, className = "" }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-white p-5 ${className}`}>
      {title && <h2 className="mb-4 text-sm font-semibold text-slate-900">{title}</h2>}
      {children}
    </section>
  );
}

export function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-success",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-destructive",
    blue: "bg-blue-100 text-blue-700",
  };
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export const statusTone = (s) =>
  ({ placed: "blue", processing: "amber", shipped: "blue", out_for_delivery: "blue", delivered: "green", cancelled: "red", refunded: "red" })[s] ?? "slate";

export function Centered({ children }) {
  return <div className="grid min-h-screen place-items-center p-6 text-cente">{children}</div>;
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 border-b">
      {tabs.map(([key, label]) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
            value === key ? "border-background" : "border-transparent"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}