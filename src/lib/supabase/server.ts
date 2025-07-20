// Re-exporta do cliente principal do core
export { createSupabaseServerClient, createSupabaseAdminClient } from '@/core/supabase/server';

// DEPRECATED: Função legacy removida - use createSupabaseServerClient ou createSupabaseAdminClient
// Esta função causava problemas de autenticação no RLS porque criava clientes sem cookies adequados 