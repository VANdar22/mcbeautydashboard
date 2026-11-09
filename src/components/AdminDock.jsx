import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import { Home01Icon, Mail01Icon, Settings01Icon } from "@hugeicons/core-free-icons";
import Dock from "./Dock";
import { supabase } from "../lib/supabase";

const glyph = (icon) => <HugeiconsIcon icon={icon} size="1em" strokeWidth={1.8} />;

// Simple line icons for the pages that don't use a Hugeicons one.
// To use Hugeicons for these too, find a name on hugeicons.com and swap it in with glyph().
const svg = (shapes) => (
  <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="1.8"
       strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {shapes}
  </svg>
);

const ICONS = {
  orders: svg(<><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></>),
  products: svg(<><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></>),
  catalog: svg(<><path d="M3 12V4h8l9 9-8 8-9-9Z" /><circle cx="7.5" cy="8.5" r="1.2" /></>),
  banners: svg(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m21 16-5-5-9 9" /></>),
  rewards: svg(<><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13" /><path d="M5 12v9h14v-9" /><path d="M7.5 8a2.5 2.5 0 1 1 0-5C10 3 12 8 12 8s2-5 4.5-5a2.5 2.5 0 1 1 0 5" /></>),
};

// One entry per screen. `menu` = quick links to a tab inside that screen.
const NAV = [
  { path: "/", label: "Dashboard", icon: glyph(Home01Icon) },
  { path: "/orders", label: "Orders", icon: ICONS.orders, badge: "orders" },
  { path: "/products", label: "Products", icon: ICONS.products },
  { path: "/catalog", label: "Catalog", icon: ICONS.catalog,
    menu: [["Brands", "brands"], ["Categories", "categories"], ["Product types", "types"]] },
  { path: "/banners", label: "Banners", icon: ICONS.banners },
  { path: "/rewards", label: "Rewards", icon: ICONS.rewards,
    menu: [["Gift cards", "cards"], ["Reward tiers", "tiers"]] },
  { path: "/inbox", label: "Inbox", icon: glyph(Mail01Icon), badge: "inbox",
    menu: [["Messages", "messages"], ["Subscribers", "subscribers"]] },
  { path: "/settings", label: "Settings", icon: glyph(Settings01Icon),
    menu: [["Store settings", "store"], ["Shipping", "shipping"]] },
];

function useIsMobile() {
  const query = "(max-width: 639px)";
  const [mobile, setMobile] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMobile(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

export default function AdminDock() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const [counts, setCounts] = useState({ orders: 0, inbox: 0 });

  // Red badges: orders waiting to be processed, unread messages.
  useEffect(() => {
    let off = false;
    Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("payment_status", "paid").eq("status", "placed"),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
    ]).then(([o, m]) => !off && setCounts({ orders: o.count ?? 0, inbox: m.count ?? 0 }));
    return () => {
      off = true;
    };
  }, [pathname]);

  const items = useMemo(
    () =>
      NAV.map(({ path, label, icon, badge, menu }) => ({
        icon,
        label,
        active: path === "/" ? pathname === "/" : pathname.startsWith(path),
        badge: badge ? counts[badge] || undefined : undefined,
        onClick: () => navigate(path),
        menu: menu?.map(([text, tab]) => ({ label: text, onClick: () => navigate(`${path}?tab=${tab}`) })),
      })),
    [pathname, counts, navigate]
  );

  return (
    // The strip is only as tall as the dock; clicks above it reach the page.
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-28 [&_*]:pointer-events-auto">
      <Dock
        items={items}
        baseItemSize={mobile ? 34 : 50}
        magnification={mobile ? 44 : 70}
        panelHeight={mobile ? 52 : 68}
        accentColor="#0a84ff"
        badgeColor="#ff453a"
        position="bottom"
        distance={200}
        gap={mobile ? 4 : 10}
        roundness={0.5}
        bounce
        autoHide={false}
        tiles
        showLabels={!mobile}
        showIndicators
        showBadges
      />
    </div>
  );
}