import ResourceManager from "../components/ResourceManager";
import { Tabs } from "../components/ui";
import { money } from "../lib/Format";
import { useTab } from "../lib/useTab";

const store = {
  table: "settings", singular: "setting", pk: "key", select: "*", order: { column: "key" },
  defaults: { is_public: true },
  columns: [
    { key: "key", label: "Setting" },
    { key: "value", label: "Value", render: (r) => <code className="text-xs">{JSON.stringify(r.value)}</code> },
    { key: "is_public", label: "Shown in shop" },
  ],
  fields: [
    { key: "key", label: "Setting name", required: true, createOnly: true },
    { key: "value", label: "Value (JSON)", type: "json", required: true,
      hint: 'Numbers as 50. Text in quotes, e.g. "Free shipping over $50".' },
    { key: "is_public", label: "Visible to the shop", type: "checkbox" },
  ],
};

const shipping = {
  table: "shipping_methods", singular: "method", select: "*", order: { column: "sort_order" }, canDelete: true,
  defaults: { is_active: true, sort_order: 0, free_over_threshold: false },
  columns: [
    { key: "name", label: "Method" },
    { key: "eta_text", label: "Delivery time" },
    { key: "price", label: "Price", render: (r) => money(r.price) },
    { key: "free_over_threshold", label: "Free over threshold" },
    { key: "is_active", label: "Available" },
  ],
  fields: [
    { key: "id", label: "ID (no spaces)", required: true, createOnly: true, hint: "For example standard or express. It can't be changed later." },
    { key: "name", label: "Name", required: true },
    { key: "eta_text", label: "Delivery time", hint: "For example 3 to 6 business days" },
    { key: "price", label: "Price", type: "number", required: true },
    { key: "free_over_threshold", label: "Free when the order passes the free-shipping amount", type: "checkbox" },
    { key: "is_active", label: "Available at checkout", type: "checkbox" },
    { key: "sort_order", label: "Order", type: "number" },
  ],
};

const TABS = { store, shipping };

export default function Settings() {
  const [tab, setTab] = useTab(Object.keys(TABS));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <Tabs tabs={[["store", "Store settings"], ["shipping", "Shipping"]]} value={tab} onChange={setTab} />
      {tab === "store" && (
        <p className="text-sm">
          Used today: <code>free_shipping_threshold</code> (number), <code>promo_text</code> (text), <code>points_per_unit</code> (number).
        </p>
      )}
      <ResourceManager key={tab} config={TABS[tab]} />
    </div>
  );
}