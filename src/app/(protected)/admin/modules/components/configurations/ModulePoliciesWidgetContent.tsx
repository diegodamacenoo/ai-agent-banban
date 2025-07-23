/**
 * ModulePoliciesWidgetContent - Versão sem Card wrapper
 * Apenas o conteúdo do widget de políticas
 */

'use client';

import React, { useState } from 'react';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { 
  Shield,
  Check,
  X,
  AlertTriangle,
  Eye,
  Edit,
  Settings
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';

export function ModulePoliciesWidgetContent() {
  // Mock data
  const policies = [
    {
      id: '1',
      name: 'Validação de Schema',
      description: 'Valida estrutura de dados dos módulos',
      type: 'validation',
      status: 'active',
      violations: 0,
      severity: 'medium'
    },
    {
      id: '2',
      name: 'Controle de Acesso',
      description: 'Verifica permissões de acesso aos módulos',
      type: 'security',
      status: 'active',
      violations: 2,
      severity: 'high'
    },
    {
      id: '3',
      name: 'Performance Mínima',
      description: 'Módulos devem atender critérios de performance',
      type: 'performance',
      status: 'warning',
      violations: 5,
      severity: 'medium'
    },
    {
      id: '4',
      name: 'Backup Obrigatório',
      description: 'Módulos críticos devem ter backup automático',
      type: 'backup',
      status: 'active',
      violations: 1,
      severity: 'low'
    }
  ];

  const stats = {
    totalPolicies: policies.length,
    activePolicies: policies.filter(p => p.status === 'active').length,
    totalViolations: policies.reduce((sum, p) => sum + p.violations, 0),
    complianceScore: 85
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'light_success',
      warning: 'light_warning',
      inactive: 'secondary'
    } as const;
    
    const labels = {
      active: 'Ativa',
      warning: 'Aviso',
      inactive: 'Inativa'
    } as const;
    
    const icons = {
      active: Check,
      warning: AlertTriangle,
      inactive: X
    };
    
    const Icon = icons[status as keyof typeof icons] || Check;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'} className="flex items-center gap-1 w-fit">
        <Icon className="w-3 h-3" />
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: 'secondary',
      medium: 'light_warning',
      high: 'light_destructive'
    } as const;
    
    const labels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta'
    } as const;
    
    return (
      <Badge variant={variants[severity as keyof typeof variants] || 'outline'}>
        {labels[severity as keyof typeof labels] || severity}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      validation: 'outline',
      security: 'light_destructive',
      performance: 'light_warning',
      backup: 'light_success'
    } as const;
    
    const labels = {
      validation: 'Validação',
      security: 'Segurança',
      performance: 'Performance',
      backup: 'Backup'
    } as const;
    
    return (
      <Badge variant={variants[type as keyof typeof variants] || 'outline'}>
        {labels[type as keyof typeof labels] || type}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas de compliance */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <div className="ml-2">
              <p className="text-sm font-medium leading-none">Total de Políticas</p>
              <p className="text-2xl font-bold">{stats.totalPolicies}</p>
            </div>
          </div>
        </div>
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center">
            <Check className="h-4 w-4 text-green-500" />
            <div className="ml-2">
              <p className="text-sm font-medium leading-none">Políticas Ativas</p>
              <p className="text-2xl font-bold">{stats.activePolicies}</p>
            </div>
          </div>
        </div>
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <div className="ml-2">
              <p className="text-sm font-medium leading-none">Violações</p>
              <p className="text-2xl font-bold">{stats.totalViolations}</p>
            </div>
          </div>
        </div>
        <div className="bg-background border rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-4 w-4 text-blue-500" />
            <div className="ml-2">
              <p className="text-sm font-medium leading-none">Score de Compliance</p>
              <p className="text-2xl font-bold">{stats.complianceScore}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de políticas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Políticas Ativas</h3>
          <Button variant="ghost" size="sm" leftIcon={<Eye className="w-3 h-3" />}>
            Ver Detalhes
          </Button>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Política</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Severidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Violações</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((policy) => (
              <TableRow key={policy.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{policy.name}</div>
                    <div className="text-sm text-muted-foreground">{policy.description}</div>
                  </div>
                </TableCell>
                <TableCell>{getTypeBadge(policy.type)}</TableCell>
                <TableCell>{getSeverityBadge(policy.severity)}</TableCell>
                <TableCell>{getStatusBadge(policy.status)}</TableCell>
                <TableCell>
                  {policy.violations > 0 ? (
                    <Badge variant="light_destructive">
                      {policy.violations}
                    </Badge>
                  ) : (
                    <Badge variant="light_success">
                      0
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Alertas de compliance */}
      {stats.totalViolations > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-800">
                Violações de Política Detectadas
              </h4>
              <p className="text-sm text-orange-700 mt-1">
                {stats.totalViolations} violação(ões) encontrada(s). 
                Revise as políticas marcadas para manter a conformidade do sistema.
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Revisar Violações
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}