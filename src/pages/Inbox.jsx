import ResourceManager from "../components/ResourceManager";
import { Badge, Tabs } from "../components/ui";
import { useTab } from "../lib/useTab";

const messages = {
  table: "contact_messages", singular: "message", select: "*", order: { column: "created_at", ascending: false },
  canCreate: false, canDelete: true,
  columns: [
    { key: "created_at", label: "Received" },
    { key: "name", label: "From" },
    { key: "subject", label: "Subject" },
    { key: "status", label: "Status", render: (r) => <Badge tone={r.status === "new" ? "blue" : r.status === "replied" ? "green" : "slate"}>{r.status}</Badge> },
  ],
  fields: [
    { key: "name", label: "Name", type: "display" },
    { key: "email", label: "Email", type: "display" },
    { key: "subject", label: "Subject", type: "display" },
    { key: "message", label: "Message", type: "display" },
    { key: "status", label: "Status", type: "select", required: true, options: ["new", "read", "replied"] },
  ],
  renderExtra: (row) => (
    <a
      href={`mailto:${row.email}?subject=${encodeURIComponent(`Re: ${row.subject ?? "your message"}`)}`}
      className="inline-block rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium hover:bg-slate-100"
    >
      Reply by email
    </a>
  ),
};

const subscribers = {
  table: "subscribers", singular: "subscriber", pk: "email", select: "*", order: { column: "subscribed_at", ascending: false },
  canCreate: false, canDelete: true,
  columns: [
    { key: "email", label: "Email" },
    { key: "source", label: "From" },
    { key: "subscribed_at", label: "Joined" },
    { key: "unsubscribed_at", label: "Left" },
  ],
  fields: [
    { key: "email", label: "Email", type: "display" },
    { key: "source", label: "From", type: "display" },
    { key: "subscribed_at", label: "Joined", type: "display" },
    { key: "unsubscribed_at", label: "Unsubscribed on (leave empty if still subscribed)", type: "datetime" },
  ],
};

const TABS = { messages, subscribers };

export default function Inbox() {
  const [tab, setTab] = useTab(Object.keys(TABS));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Inbox</h1>
      <Tabs tabs={[["messages", "Messages"], ["subscribers", "Newsletter subscribers"]]} value={tab} onChange={setTab} />
      <ResourceManager key={tab} config={TABS[tab]} />
    </div>
  );
}