'use client';

import { Button } from '@/shared/ui/button';
import { Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function PlannedModulesButton() {
  const router = useRouter();

  return (
    <Button
      variant="outline"
      leftIcon={<Clock className="h-4 w-4" />}
      onClick={() => router.push('/admin/modules/planned')}
    >
      Módulos Planejados
    </Button>
  );
} 