import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuration with environment variable support & resilient production fallbacks
const SUPABASE_URL = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || 
  'https://kfmtlrmttskqaepoznwy.supabase.co';

const SUPABASE_ANON_KEY = 
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || 
  'sb_publishable_dnnUOFUQhzVx3tPkVE7N1g_b9wtlIcv';

let supabaseInstance: SupabaseClient | null = null;

try {
  if (SUPABASE_URL && SUPABASE_ANON_KEY && !SUPABASE_URL.includes('your-project')) {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
} catch (error) {
  console.warn('[Supabase] Client initialization notice:', error);
}

export const supabase = supabaseInstance;
export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseInstance &&
    SUPABASE_URL &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_URL.includes('your-project')
  );
};
export const getSupabaseConfig = () => ({
  url: SUPABASE_URL,
  isConfigured: isSupabaseConfigured(),
});
