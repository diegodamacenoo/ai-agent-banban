'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { ScrollText, Clock, User, Activity } from 'lucide-react';
import type { ActivityLog } from '../../types/module-details';

interface ModuleActivityLogProps {
  logs: ActivityLog[];
  moduleId: string;
}

export default function ModuleActivityLog({ logs, moduleId }: ModuleActivityLogProps) {
  const formatRelativeTime = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-yellow-600';
      case 'info': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ScrollText className="w-5 h-5 mr-2" />
            Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Nenhuma atividade registrada
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ScrollText className="w-5 h-5 mr-2" />
          Activity Log
          <Badge variant="outline" className="ml-auto">
            {logs.length} entradas
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg border bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Activity className={`w-4 h-4 mt-0.5 ${getSeverityColor(log.severity)}`} />
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {log.event_description}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatRelativeTime(log.created_at)}
                      </span>
                      
                      {log.tenant_name && (
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {log.tenant_name}
                        </span>
                      )}
                      
                      <Badge variant="outline" className="text-xs">
                        {log.event_type}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-gray-400 ml-2">
                  {new Date(log.created_at).toLocaleTimeString('pt-BR')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}