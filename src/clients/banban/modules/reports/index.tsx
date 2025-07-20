import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

interface ReportsModuleProps {
  tenantId?: string;
  config?: any;
}

export default function ReportsModule({ tenantId, config }: ReportsModuleProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Relatórios - Banban</CardTitle>
        <CardDescription>Módulo de relatórios para o cliente Banban</CardDescription>
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

export const Component = ReportsModule;