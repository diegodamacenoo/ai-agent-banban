import { createClient } from '@supabase/supabase-js';

// Função para verificar autenticação em Next.js API routes
export async function checkAuthHeader(authHeader: string | undefined) {
  if (!authHeader) {
    return { success: false, error: 'Token de autenticação não fornecido', status: 401 };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  
  if (error || !user) {
    return { success: false, error: 'Token inválido ou expirado', status: 401 };
  }

  return { success: true, user };
}

// Função auxiliar para Next.js API routes
export async function authenticateNextJsRequest(req: any, permission?: string) {
  const authHeader = req.headers.authorization;
  const authResult = await checkAuthHeader(authHeader);
  
  if (!authResult.success) {
    return authResult;
  }

  if (permission) {
    // TODO: Implementar verificação de permissões específicas
    // Por enquanto, apenas retorna sucesso se autenticado
    return { success: true, user: authResult.user };
  }

  return authResult;
}

