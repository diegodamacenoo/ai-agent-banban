'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export default function AlertThresholdsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Configuração de Thresholds</h1>
          <p className="text-muted-foreground mt-2">
            Configure os limites que disparam alertas automáticos no sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Thresholds de Alertas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Configuração de thresholds em desenvolvimento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}