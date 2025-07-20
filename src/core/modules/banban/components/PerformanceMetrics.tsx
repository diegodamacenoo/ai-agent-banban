'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';

const PerformanceMetrics: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance Banban</h1>
        <p className="text-muted-foreground">
          Métricas de performance e análises
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Performance</CardTitle>
          <CardDescription>Em desenvolvimento</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Componente em desenvolvimento...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMetrics; 