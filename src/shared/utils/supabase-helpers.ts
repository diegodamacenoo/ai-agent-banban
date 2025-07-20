/**
 * Utilitários para consultas Supabase mais robustas
 */

/**
 * Executa uma consulta que deveria retornar um único registro, mas lida melhor com casos
 * onde há múltiplos registros ou nenhum registro, evitando erros de .single()
 */
export async function getSingleRecord<T>(
  query: any,
  context?: string
): Promise<{ data: T | null; error: any }> {
  try {
    const { data, error } = await query.limit(1);
    
    if (error) {
      return { data: null, error };
    }
    
    if (!data || data.length === 0) {
      if (context) {
        console.warn(`[getSingleRecord] No records found for ${context}`);
      }
      return { data: null, error: null };
    }
    
    if (data.length > 1) {
      if (context) {
        console.warn(`[getSingleRecord] Multiple records found for ${context}. Using first. Total: ${data.length}`);
      }
    }
    
    return { data: data[0], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Busca o perfil de um usuário de forma robusta
 */
export async function getUserProfile(supabase: any, userId: string, fields: string = '*') {
  const query = supabase
    .from('profiles')
    .select(fields)
    .eq('id', userId);
    
  return getSingleRecord(query, `user profile for ${userId}`);
}

/**
 * Busca uma organização por ID de forma robusta
 */
export async function getOrganizationById(supabase: any, organizationId: string, fields: string = '*') {
  const query = supabase
    .from('organizations')
    .select(fields)
    .eq('id', organizationId);
    
  return getSingleRecord(query, `organization ${organizationId}`);
} 