'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

const DataProcessingStatus: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Processamento de Dados</h1>
        <p className="text-muted-foreground">
          Status do processamento em tempo real
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Status dos Listeners</CardTitle>
          <CardDescription>Em desenvolvimento</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Componente em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataProcessingStatus; 