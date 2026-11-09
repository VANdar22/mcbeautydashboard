import { Outlet } from "react-router-dom";
import { UserButton } from "@clerk/clerk-react";
import AdminDock from "./AdminDock";

export default function Layout() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
        <span className="font-semibold">MC Beauty admin</span>
        <UserButton />
      </header>

      {/* pb-36 keeps the last rows from hiding behind the dock */}
      <main className="mx-auto max-w-6xl p-4 pb-36 md:p-8 md:pb-36">
        <Outlet />
      </main>

      <AdminDock />
    </div>
  );
}