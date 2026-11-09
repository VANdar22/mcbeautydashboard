export const money = (n, code = "USD") =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: code }).format(Number(n) || 0);
  
  export const dateTime = (v) =>
    new Date(v).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  
  export const slugify = (v) => String(v).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  
  export const STATUSES = ["placed", "processing", "shipped", "out_for_delivery", "delivered", "cancelled", "refunded"];
  export const statusLabel = (s) => s.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());