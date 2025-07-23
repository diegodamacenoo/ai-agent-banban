'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect automático para a área de gestão
 * 
 * A página principal de módulos agora redireciona diretamente
 * para a gestão, que contém o conteúdo principal em abas.
 */
export default function ModulesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/modules/management');
  }, [router]);

  return null; // Não renderiza nada, apenas redireciona
}