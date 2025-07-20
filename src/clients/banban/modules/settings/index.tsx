import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

interface SettingsModuleProps {
  tenantId?: string;
  config?: any;
}

export default function SettingsModule({ tenantId, config }: SettingsModuleProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações - Banban</CardTitle>
        <CardDescription>Módulo de configurações para o cliente Banban</CardDescription>
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

export const Component = SettingsModule;