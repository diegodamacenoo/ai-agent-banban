import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '@/lib/supabase/config';

declare global {
  var supabaseClient: SupabaseClient | undefined;
}

// Singleton para o cliente Supabase
let supabaseClient: SupabaseClient;

if (process.env.NODE_ENV === 'production') {
  supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
} else {
  if (!global.supabaseClient) {
    global.supabaseClient = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  }
  supabaseClient = global.supabaseClient;
}

export { supabaseClient as client }; 