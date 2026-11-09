import { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { SignIn, SignOutButton, useUser } from "@clerk/clerk-react";
import { supabase } from "./lib/supabase";
import Layout from "./components/Layout";
import { Centered, btnGhost } from "./components/ui";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import Catalog from "./pages/Catalog";
import Banners from "./pages/Banners";
import Rewards from "./pages/Rewards";
import Inbox from "./pages/Inbox";
import Settings from "./pages/Settings";

// Only people listed in the `admins` table get past this. The database enforces it too,
// so hiding the pages is for convenience, not the only protection.
function AdminGate({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [state, setState] = useState("checking"); // checking | admin | denied
  const [problem, setProblem] = useState("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return undefined;
    let cancelled = false;
    supabase
      .from("admins")
      .select("user_id")
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        setProblem(error?.message ?? "");
        setState(data && !error ? "admin" : "denied");
      });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) return <Centered>Loading…</Centered>;
  if (!isSignedIn)
    return (
      <Centered>
        <SignIn routing="hash" />
      </Centered>
    );
  if (state === "checking") return <Centered>Checking access…</Centered>;
  if (state === "denied")
    return (
      <Centered>
        <div className="space-y-4">
          <p>This account doesn't have admin access.</p>
          <p className="text-sm">
            Your user id (add it to the admins table):
            <br />
            <code className="select-all break-all rounded bg-slate-100 px-2 py-1 text-xs">{user?.id}</code>
          </p>
          {problem && <p className="text-xs text-red-600">Database said: {problem}</p>}
          <SignOutButton>
            <button className={btnGhost}>Sign out</button>
          </SignOutButton>
        </div>
      </Centered>
    );
  return children;
}

export default function App() {
  return (
    <AdminGate>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="products" element={<Products />} />
          <Route path="catalog" element={<Catalog />} />
          <Route path="banners" element={<Banners />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="inbox" element={<Inbox />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </AdminGate>
  );
}