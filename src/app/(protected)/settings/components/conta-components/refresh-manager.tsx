'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RefreshManagerProps {
  shouldRefresh: boolean;
}

export default function RefreshManager({ shouldRefresh }: RefreshManagerProps) {
  const router = useRouter();

  useEffect(() => {
    if (shouldRefresh) {
      router.refresh();
    }
  }, [shouldRefresh, router]);

  return null;
}
