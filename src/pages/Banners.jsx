import ResourceManager from "../components/ResourceManager";

const config = {
  table: "banners", singular: "banner", select: "*", order: { column: "sort_order" }, canDelete: true,
  defaults: { is_active: true, sort_order: 0, font: "ranchers", placement: "home" },
  columns: [
    { key: "image_url", label: "Image", render: (r) => <img src={r.image_url} alt="" className="h-10 w-16 rounded object-cover" /> },
    { key: "placement", label: "Where" },
    { key: "target_slug", label: "Target" },
    { key: "title", label: "Title" },
    { key: "is_active", label: "Live" },
  ],
  fields: [
    { key: "placement", label: "Where it shows", type: "select", required: true, options: ["home", "brand", "collection", "category", "default"] },
    { key: "target_slug", label: "Target", hint: "Brand slug, collection (best-offers, new-in, deals) or category slug. Leave empty for home and default." },
    { key: "image_url", label: "Background image", type: "image", required: true },
    { key: "product_image_url", label: "Product image (optional)", type: "image" },
    { key: "tag", label: "Small tag, e.g. LIMITED TIME" },
    { key: "title", label: "Headline" },
    { key: "body", label: "Text", type: "textarea" },
    { key: "cta_label", label: "Button text" },
    { key: "cta_href", label: "Button link", hint: "For example /products?collection=deals" },
    { key: "font", label: "Headline font", type: "select", options: ["ranchers", "lobster", "michroma", "ultra"] },
    { key: "sort_order", label: "Order", type: "number" },
    { key: "starts_at", label: "Starts (optional)", type: "datetime" },
    { key: "ends_at", label: "Ends (optional)", type: "datetime" },
    { key: "is_active", label: "Live", type: "checkbox" },
  ],
};

export default function Banners() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Banners</h1>
      <p className="text-sm text-slate-500">
        These are saved in the database. Your shop's home page and product pages need to read them (they are still fixed in code today).
      </p>
      <ResourceManager config={config} />
    </div>
  );
}