'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar imediatamente para admin
    router.replace('/admin');
  }, [router]);

  // Retornar null para não mostrar nada
  return null;
}