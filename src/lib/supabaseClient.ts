import { createClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const boardKey = import.meta.env.VITE_BOARD_KEY as string | undefined;

if (!url || !anon) {
  console.error("[supabase] Missing env. Check .env.local");
}

export const supabase = createClient(url!, anon!, {
  global: boardKey ? { headers: { "x-board-key": boardKey } } : undefined,
  auth: { persistSession: false, autoRefreshToken: false },
});