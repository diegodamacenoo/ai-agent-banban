'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats } from '@/app/actions/admin/dashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Building2,
  Users,
  Activity,
  TrendingUp,
  Plus,
  Eye,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Clock,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { AuthDiagnostics } from '@/features/diagnostics/AuthDiagnostics';
import { CreateOrganizationDrawer } from '@/features/admin/create-organization-sheet';
import { CreateUserSheet } from '@/features/admin/create-user-sheet';
import { Breadcrumb, BreadcrumbLink, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/shared/ui/breadcrumb';

interface AuditLogActivity {
  id: string;
  action_type: string;
  resource_type: string;
  resource_id?: string;
  action_timestamp: string;
  ip_address?: string;
  user_agent?: string;
  organization_id?: string;
  details?: Record<string, any>;
}

interface DashboardStats {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  activeUsers: number;
  recentActivity: AuditLogActivity[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setError(null);

        const result = await getDashboardStats();

        if (result.error) {
          setError(result.error);
          return;
        }

        if (result.data) {
          setStats(result.data);
        }

      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
        setError('Erro inesperado ao carregar o dashboard');
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between h-[81px] px-6 border-b border-zinc-200 min-w-0">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/admin"
                  className="text-xl font-semibold text-zinc-900 truncate">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex gap-3">
            <Button disabled variant="outline">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Carregando...
            </Button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="flex flex-row min-w-0">
            {/* Coluna Esquerda - Loading */}
            <div className="flex flex-col border-r border-zinc-200 gap-4 py-4 px-6 w-1/4 min-w-0">
              <div className="flex items-center justify-between min-w-0">
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold flex items-center gap-2 truncate">
                    <BarChart3 className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">Analytics</span>
                  </h3>
                </div>
              </div>
              <div className="flex flex-col divide-y divide-zinc-200 rounded-lg border min-w-0">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-5 min-w-0">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-zinc-200 animate-pulse flex-shrink-0"></div>
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="h-4 bg-zinc-200 rounded animate-pulse w-24"></div>
                        <div className="h-3 bg-zinc-200 rounded animate-pulse w-16"></div>
                      </div>
                    </div>
                    <div className="h-6 bg-zinc-200 rounded animate-pulse w-8 flex-shrink-0"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Coluna Direita - Loading */}
            <div className="flex-1 flex flex-col gap-4 py-4 px-6 min-w-0">
              <div className="flex items-center justify-between min-w-0">
                <div className="min-w-0">
                  <h3 className="text-xl font-medium flex items-center gap-2 truncate">
                    <Activity className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">Gestão do Sistema</span>
                  </h3>
                </div>
              </div>
              <Card className="min-w-0 bg-transparent border-transparent">
                <CardHeader className="min-w-0">
                  <CardTitle className="truncate">Carregando dados...</CardTitle>
                </CardHeader>
                <CardContent className="min-w-0">
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-zinc-200 rounded animate-pulse"></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between h-[81px] px-6 border-b border-zinc-200 min-w-0">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/admin"
                  className="text-xl font-medium text-zinc-900 truncate">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex gap-3">
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Tentar Novamente
            </Button>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 min-w-0">
          <Card className="min-w-0">
            <CardContent className="pt-6 min-w-0">
              <div className="flex items-center gap-2 text-destructive min-w-0">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{error}</span>
              </div>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="mt-4"
              >
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between h-[75px] px-6 border-b border-zinc-200 min-w-0">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/admin"
                className="text-xl font-medium text-zinc-900 truncate">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="flex gap-3">
          <CreateUserSheet />
          <CreateOrganizationDrawer />
        </div>
      </div>

      {/* Conteúdo com Rolagem */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="flex flex-row min-w-0">
          {/* Coluna Esquerda - Analytics */}
          <div className="flex flex-col border-r border-zinc-200 gap-4 py-4 px-6 w-1/4 min-w-0">
            <div className="flex items-center justify-between min-w-0">
              <div className="min-w-0">
                <h3 className="text-xl font-medium flex items-center gap-2 truncate">
                  <BarChart3 className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">Analytics</span>
                </h3>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="flex flex-col divide-y divide-zinc-200 rounded-lg border min-w-0">
              {/* Total Organizations */}
              <div className="flex items-center justify-between px-4 py-5 min-w-0">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 truncate">Total de Organizações</p>
                    <p className="text-sm text-zinc-500 truncate">Todas as organizações</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {stats?.totalOrganizations || 0}
                  </span>
                </div>
              </div>

              {/* Active Organizations */}
              <div className="flex items-center justify-between px-4 py-5 min-w-0">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 truncate">Organizações Ativas</p>
                    <p className="text-sm text-zinc-500 truncate">Implementação completa</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    {stats?.activeOrganizations || 0}
                  </span>
                </div>
              </div>

              {/* Total Users */}
              <div className="flex items-center justify-between px-4 py-5 min-w-0">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 truncate">Total de Usuários</p>
                    <p className="text-sm text-zinc-500 truncate">Todos os usuários</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                    {stats?.totalUsers || 0}
                  </span>
                </div>
              </div>

              {/* Active Users */}
              <div className="flex items-center justify-between px-4 py-5 min-w-0">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Activity className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="space-y-1 min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 truncate">Usuários Ativos</p>
                    <p className="text-sm text-zinc-500 truncate">Últimos 30 dias</p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                    {stats?.activeUsers || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Gestão */}
          <div className="flex-1 flex flex-col gap-4 py-4 px-6 min-w-0">
            <div className="flex items-center justify-between min-w-0">
              <div className="min-w-0">
                <h3 className="text-xl font-medium flex items-center gap-2 truncate">
                  <Activity className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">Gestão do Sistema</span>
                </h3>
              </div>
            </div>

            {/* Quick Actions */}
            <Card className="bg-transparent border-transparent">
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Principais ações administrativas do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Gestão de Organizações
                      </CardTitle>
                      <CardDescription>
                        Criar e gerenciar organizações do sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      <div className="flex gap-2">
                        <Link href="/admin/organizations" className="flex-1">
                          <Button variant="outline" className="w-full" leftIcon={<Eye className="h-4 w-4" />}>
                            Ver Todas
                          </Button>
                        </Link>
                        <CreateOrganizationDrawer
                          trigger={
                            <Button variant="default" className="w-full" leftIcon={<Plus className="h-4 w-4" />}>
                              Criar Nova
                            </Button>
                          }
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Usuários das Organizações
                      </CardTitle>
                      <CardDescription>
                        Gerenciar usuários vinculados às organizações
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4">
                      <div className="flex gap-2">
                        <Link href="/admin/users" className="flex-1">
                          <Button variant="outline" className="w-full" leftIcon={<Eye className="h-4 w-4" />}>
                            Ver Usuários
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Diagnóstico de Autenticação */}
            <Card className="min-w-0 bg-transparent border-transparent">
              <CardHeader className="min-w-0">
                <CardTitle className="truncate">Diagnóstico de Autenticação</CardTitle>
                <CardDescription className="truncate">Verificação do sistema de autenticação</CardDescription>
              </CardHeader>
              <CardContent className="min-w-0">
                <AuthDiagnostics />
              </CardContent>
            </Card>

            {/* Atividade Recente */}
            <Card className="min-w-0 bg-transparent border-transparent">
              <CardHeader className="min-w-0">
                <CardTitle className="truncate">Atividade Recente</CardTitle>
                <CardDescription className="truncate">Últimas ações no sistema</CardDescription>
              </CardHeader>
              <CardContent className="min-w-0">
                <div className="space-y-4">
                  {stats?.recentActivity?.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                        <Eye className="h-4 w-4 text-zinc-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-900 truncate">
                          {activity.action_type} - {activity.resource_type}
                        </p>
                        <p className="text-sm text-zinc-500 truncate">
                          {new Date(activity.action_timestamp).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 




