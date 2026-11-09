import { createClient } from "@supabase/supabase-js";

// The admin's Clerk login is sent with every request. The database checks the admins table.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { accessToken: async () => (await window.Clerk?.session?.getToken()) ?? null }
);