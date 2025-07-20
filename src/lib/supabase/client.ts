'use client';

import { createClient } from '@supabase/supabase-js';

// Cliente singleton para o lado client
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Função de conveniência para usar o cliente
export function createSupabaseClientSide() {
  return supabaseClient;
}