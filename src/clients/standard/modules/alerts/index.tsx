import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

interface AlertsModuleProps {
  tenantId?: string;
  config?: any;
}

export default function AlertsModule({ tenantId, config }: AlertsModuleProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas - Standard</CardTitle>
        <CardDescription>Módulo de alertas padrão do sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p>Tenant ID: {tenantId}</p>
          <p>Este módulo está em desenvolvimento.</p>
          <p>Configuração: {JSON.stringify(config, null, 2)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export const Component = AlertsModule;