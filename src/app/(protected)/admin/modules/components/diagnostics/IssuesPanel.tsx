'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import type { ModuleIssue } from '../../types/module-details';

interface IssuesPanelProps {
  issues: ModuleIssue[];
  moduleId: string;
}

export default function IssuesPanel({ issues, moduleId }: IssuesPanelProps) {
  if (issues.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
            Status do Módulo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tudo funcionando perfeitamente!
            </h3>
            <p className="text-gray-500">
              Nenhum problema detectado neste módulo.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getIssueIcon = (issueType: string) => {
    switch (issueType) {
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <AlertTriangle className="w-5 h-5 text-blue-500" />;
    }
  };

  const getIssueTypeColor = (issueType: string) => {
    switch (issueType) {
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}min atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    return `${Math.floor(hours / 24)}d atrás`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
          Issues & Alertas
          <Badge variant="destructive" className="ml-2">
            {issues.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className={`p-4 rounded-lg border ${getIssueTypeColor(issue.issue_type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getIssueIcon(issue.issue_type)}
                  
                  <div className="flex-1">
                    <h5 className="text-sm font-medium text-gray-900 mb-1">
                      {issue.title}
                    </h5>
                    
                    <p className="text-sm text-gray-700 mb-2">
                      {issue.description}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatTimeAgo(issue.created_at)}
                      </span>
                      
                      {issue.tenant_name && (
                        <span>Tenant: {issue.tenant_name}</span>
                      )}
                    </div>

                    {issue.suggested_actions.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <p className="text-xs font-medium text-gray-600">Ações sugeridas:</p>
                        {issue.suggested_actions.slice(0, 2).map((action, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            • {action}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs ml-2"
                >
                  Resolver
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}