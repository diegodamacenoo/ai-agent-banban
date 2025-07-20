'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { CheckCircle, AlertCircle, Clock, Activity } from 'lucide-react';

interface ModuleDiagnosticsProps {
  className?: string;
}

const ModuleDiagnostics: React.FC<ModuleDiagnosticsProps> = ({ className = '' }) => {
  const diagnostics = [
    {
      module: 'Inventário',
      status: 'healthy',
      lastCheck: '2 min atrás',
      performance: 98
    },
    {
      module: 'Performance',
      status: 'healthy',
      lastCheck: '3 min atrás',
      performance: 95
    },
    {
      module: 'Analytics',
      status: 'warning',
      lastCheck: '5 min atrás',
      performance: 87
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-700">Saudável</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Atenção</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {diagnostics.map((diagnostic) => (
            <Card key={diagnostic.module}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {diagnostic.module}
                </CardTitle>
                {getStatusIcon(diagnostic.status)}
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    {getStatusBadge(diagnostic.status)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Performance:</span>
                    <div className="flex items-center space-x-1">
                      <Activity className="h-3 w-3" />
                      <span className="text-xs font-medium">{diagnostic.performance}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Última verificação:</span>
                    <span className="text-xs">{diagnostic.lastCheck}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModuleDiagnostics; 

// AIDEV-NOTE: This component is a candidate for being moved to a shared 'diagnostics' feature folder if its usage expands beyond the admin module section. For now, it's specific to module management.