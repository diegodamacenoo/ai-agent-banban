'use client';

import {
  Users,
  UserCheck,
  UserX,
  Activity,
  Calendar,
  Clock,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface OrganizationStatsProps {
  stats: {
    total_users: number;
    active_users: number;
    inactive_users: number;
    recent_activity_count: number;
    days_since_creation: number;
    days_since_implementation?: number;
  };
  loading?: boolean;
}

export function OrganizationStats({ stats, loading }: OrganizationStatsProps) {
  if (loading) {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="animate-pulse bg-gray-200 rounded-full h-8 w-8"></div>
                  <div className="animate-pulse bg-gray-200 rounded h-4 w-24"></div>
                </div>
                <div className="animate-pulse bg-gray-200 rounded h-6 w-12"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const statsData = [
    {
      icon: Users,
      label: 'Total de Usuários',
      value: stats.total_users,
      description: 'usuários cadastrados',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: UserCheck,
      label: 'Usuários Ativos',
      value: stats.active_users,
      description: stats.total_users > 0 
        ? `${Math.round((stats.active_users / stats.total_users) * 100)}% do total`
        : 'nenhum usuário',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: UserX,
      label: 'Usuários Inativos',
      value: stats.inactive_users,
      description: stats.total_users > 0 
        ? `${Math.round((stats.inactive_users / stats.total_users) * 100)}% do total`
        : 'nenhum usuário',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600'
    },
    {
      icon: TrendingUp,
      label: 'Atividade Recente',
      value: stats.recent_activity_count,
      description: 'ações nos últimos 7 dias',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <Card size="sm" variant="default">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-900">Estatísticas da Organização</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 divide-y divide-zinc-200">
          {statsData.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div 
                key={index} 
                className="flex items-center justify-between py-3 pr-2 rounded-sm"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <IconComponent className={`h-4 w-4 ${stat.iconColor}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {stat.label}
                    </span>
                    <span className="text-xs text-gray-500">
                      {stat.description}
                    </span>
                  </div>
                </div>
                <div className={`text-lg font-semibold`}>
                  {stat.value.toLocaleString()}
                </div>
              </div>
            );
          })}
          
        </div>
      </CardContent>
    </Card>
  );
} 