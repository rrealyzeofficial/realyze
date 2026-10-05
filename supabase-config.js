// RƎ:ALYZE CMS - Supabase config
// Điền Project URL và anon public key từ Supabase > Project Settings > API.
export const SUPABASE_URL = "https://jrtqnhbrgokerssvupnl.supabase.co";
export const SUPABASE_ANON_KEY = "sb_publishable_s5BKl2wmbGAxg6roNWEVUw_gEwaAXdb";

export const isSupabaseConfigured =
  !SUPABASE_URL.includes("https://jrtqnhbrgokerssvupnl.supabase.co") &&
  !SUPABASE_ANON_KEY.includes("sb_publishable_s5BKl2wmbGAxg6roNWEVUw_gEwaAXdb");
