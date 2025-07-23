'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { 
  Building2, 
  Users, 
  Activity, 
  AlertTriangle, 
  Eye,
  Plus,
  BarChart3,
  CheckCircle,
  TrendingUp,
  Calendar,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { Breadcrumb, BreadcrumbLink, BreadcrumbItem, BreadcrumbList } from '@/shared/ui/breadcrumb';

export default function AdminDashboard() {
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Criar Usuário
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nova Organização
          </Button>
        </div>
      </div>

      {/* Content with Scroll */}
      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="flex flex-row min-w-0">
          {/* Left Column - Analytics */}
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
                    -
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
                    -
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
                    -
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
                    -
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Management */}
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
                          <Button variant="outline" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Todas
                          </Button>
                        </Link>
                        <Button variant="default" className="flex-1">
                          <Plus className="h-4 w-4 mr-2" />
                          Criar Nova
                        </Button>
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
                          <Button variant="outline" className="w-full">
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Usuários
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="min-w-0 bg-transparent border-transparent">
              <CardHeader className="min-w-0">
                <CardTitle className="truncate">Status do Sistema</CardTitle>
                <CardDescription className="truncate">Estado atual da aplicação</CardDescription>
              </CardHeader>
              <CardContent className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Sistema funcionando normalmente</span>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Última atualização: {new Date().toLocaleString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}