import ResourceManager from "../components/ResourceManager";
import { Badge, Tabs } from "../components/ui";
import { money } from "../lib/Format";
import { useTab } from "../lib/useTab";

const STATUS_TONE = { active: "green", claimed: "blue", used: "slate", void: "red", pending: "amber" };

const cards = {
  table: "gift_cards", singular: "gift card", select: "*", order: { column: "created_at", ascending: false },
  defaults: { status: "active", source: "admin" },
  columns: [
    { key: "code", label: "Code" },
    { key: "amount", label: "Value", render: (r) => money(r.amount) },
    { key: "status", label: "Status", render: (r) => <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge> },
    { key: "source", label: "From" },
    { key: "recipient_email", label: "Recipient" },
  ],
  fields: [
    { key: "code", label: "Code", type: "display", placeholder: "Created automatically when you save" },
    { key: "amount", label: "Value", type: "number", required: true, createOnly: true },
    { key: "status", label: "Status", type: "select", required: true, options: ["active", "claimed", "used", "void", "pending"],
      hint: "Active = can be claimed with its code. Void cancels a card." },
    { key: "recipient_name", label: "Recipient name" },
    { key: "recipient_email", label: "Recipient email" },
    { key: "message", label: "Message", type: "textarea" },
    { key: "source", label: "Created by", type: "display" },
    { key: "owner_id", label: "Held by (customer id)", type: "display" },
    { key: "used_at", label: "Used on", type: "display" },
  ],
};

const tiers = {
  table: "reward_tiers", singular: "reward", select: "*", order: { column: "amount" }, canDelete: true,
  defaults: { is_active: true },
  columns: [
    { key: "amount", label: "Gift card value", render: (r) => money(r.amount) },
    { key: "cost_points", label: "Points needed" },
    { key: "is_active", label: "Available" },
  ],
  fields: [
    { key: "amount", label: "Gift card value", type: "number", required: true },
    { key: "cost_points", label: "Points needed", type: "number", required: true },
    { key: "is_active", label: "Available to customers", type: "checkbox" },
  ],
};

const TABS = { cards, tiers };

export default function Rewards() {
  const [tab, setTab] = useTab(Object.keys(TABS));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Rewards</h1>
      <Tabs tabs={[["cards", "Gift cards"], ["tiers", "Reward tiers"]]} value={tab} onChange={setTab} />
      <ResourceManager key={tab} config={TABS[tab]} />
    </div>
  );
}