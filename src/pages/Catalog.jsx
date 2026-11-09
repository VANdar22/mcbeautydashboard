import ResourceManager from "../components/ResourceManager";
import { Tabs } from "../components/ui";
import { useTab } from "../lib/useTab";

const brands = {
  table: "brands", singular: "brand", select: "*", order: { column: "name" }, canDelete: true,
  defaults: { is_active: true, sort_order: 0 },
  columns: [
    { key: "name", label: "Brand" },
    { key: "slug", label: "URL name" },
    { key: "is_active", label: "Visible" },
  ],
  fields: [
    { key: "name", label: "Name", required: true },
    { key: "slug", label: "URL name (slug)", autoSlugFrom: "name", hint: "Used in links, e.g. /products?brand=cerave" },
    { key: "logo_url", label: "Logo", type: "image" },
    { key: "fallback_image_url", label: "Photo for products that have none", type: "image" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "sort_order", label: "Sort order", type: "number" },
    { key: "is_active", label: "Visible in the shop", type: "checkbox" },
  ],
};

const categories = {
  table: "categories", singular: "category", select: "*", order: { column: "sort_order" }, canDelete: true,
  defaults: { sort_order: 0 },
  columns: [
    { key: "name", label: "Category" },
    { key: "slug", label: "URL name" },
  ],
  fields: [
    { key: "slug", label: "URL name (slug)", required: true, createOnly: true, hint: "Keep skincare, hair and perfume: the shop's menu links use them." },
    { key: "name", label: "Name", required: true },
    { key: "fallback_image_url", label: "Photo for products that have none", type: "image" },
    { key: "sort_order", label: "Sort order", type: "number" },
  ],
};

const types = {
  table: "product_types", singular: "type", select: "*, categories(name)", order: { column: "name" }, canDelete: true,
  defaults: { sort_order: 0 },
  columns: [
    { key: "name", label: "Type" },
    { key: "category", label: "Category", render: (r) => r.categories?.name ?? "—" },
    { key: "slug", label: "URL name" },
  ],
  fields: [
    { key: "category_id", label: "Category", type: "select", required: true, optionsFrom: { table: "categories" } },
    { key: "name", label: "Name", required: true },
    { key: "slug", label: "URL name (slug)", autoSlugFrom: "name" },
    { key: "sort_order", label: "Sort order", type: "number" },
  ],
};

const TABS = { brands, categories, types };

export default function Catalog() {
  const [tab, setTab] = useTab(Object.keys(TABS));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Catalog</h1>
      <Tabs tabs={[["brands", "Brands"], ["categories", "Categories"], ["types", "Product types"]]} value={tab} onChange={setTab} />
      <ResourceManager key={tab} config={TABS[tab]} />
    </div>
  );
}