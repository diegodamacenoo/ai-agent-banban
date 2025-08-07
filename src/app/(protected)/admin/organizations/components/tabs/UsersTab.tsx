import { TabsContent } from '@/shared/ui/tabs';
import { UserProfileDrawer } from '../UserProfileDrawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Users,
  MoreHorizontal,
  Eye,
  Edit,
  RefreshCw,
  UserX,
  UserCheck,
  Mail,
  Calendar,
  Search,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import { UsersSkeleton } from '../skeletons/OrganizationsPageSkeletons';
import { useBadgeHelpers } from '../../hooks';
import type { User, UserStats } from '../../types';

interface UsersTabProps {
  activeTab: string;
  loading: boolean;
  isInitialLoad: boolean;
  users: User[];
  userStats: UserStats;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterRole: 'all' | 'admin' | 'manager' | 'user';
  setFilterRole: (role: 'all' | 'admin' | 'manager' | 'user') => void;
  error?: string | null;
  onRetry?: () => void;
}

/**
 * Componente da aba de Usuários
 * Lista usuários com estatísticas e permite visualização de perfis
 */
export const UsersTab = ({
  activeTab,
  loading,
  isInitialLoad,
  users,
  userStats,
  searchQuery,
  setSearchQuery,
  filterRole,
  setFilterRole,
  error,
  onRetry,
}: UsersTabProps) => {
  const { getRoleBadge, getStatusBadgeUser } = useBadgeHelpers();
  
  // AIDEV-NOTE: Filtros gerenciados centralmente via props - sem duplicação de lógica

  if (isInitialLoad && loading) {
    return (
      <TabsContent value="users" activeValue={activeTab}>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Lista de Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-48" />
              </div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    );
  }

  return (
    <TabsContent value="users" activeValue={activeTab}>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Gestão de Usuários</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros integrados (seguindo padrão BaseModules) */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar usuários..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as funções</SelectItem>
                <SelectItem value="admin">Administradores</SelectItem>
                <SelectItem value="manager">Gerentes</SelectItem>
                <SelectItem value="user">Usuários</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Estatísticas de usuários */}
          {/* <UserStatsComponent userStats={userStats} /> */}

          {/* Tratamento de erro específico para usuários */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Erro ao carregar usuários</h4>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
                {onRetry && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={onRetry}
                    className="text-red-700 border-red-300 hover:bg-red-100"
                  >
                    Tentar novamente
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Tabela com CSS Grid (seguindo padrão BaseModules) */}
          <div className="rounded-lg">
            {/* Cabeçalho */}
            <div className="md:grid md:grid-cols-[3fr_2fr_1fr_1fr_1.5fr_0.5fr] items-center px-4 py-3 text-sm text-muted-foreground">
              <div>Usuário</div>
              <div>Organização</div>
              <div>Função</div>
              <div>Status</div>
              <div>Último Login</div>
              <div></div>
            </div>

            {/* Corpo */}
            <div>
              {users.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8" />
                    <span>
                      {error 
                        ? 'Erro ao carregar usuários' 
                        : searchQuery || filterRole !== 'all'
                          ? 'Nenhum usuário encontrado com os filtros aplicados.'
                          : 'Nenhum usuário encontrado'
                      }
                    </span>
                  </div>
                </div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="md:grid md:grid-cols-[3fr_2fr_1fr_1fr_1.5fr_0.5fr] items-center px-4 py-3 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors">
                    
                    {/* Coluna Usuário */}
                    <div className="flex items-center gap-3">
                      {/* Avatar com iniciais */}
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <UserProfileDrawer
                          user={user}
                          trigger={
                            <button className="font-medium text-left hover:text-blue-600 transition-colors cursor-pointer">
                              {user.full_name}
                            </button>
                          }
                        />
                        <span className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </span>
                      </div>
                    </div>

                    {/* Coluna Organização */}
                    <div>
                      <span className="text-sm">{user.organization_name}</span>
                    </div>

                    {/* Coluna Função */}
                    <div>
                      {getRoleBadge(user.role)}
                    </div>

                    {/* Coluna Status */}
                    <div>
                      {getStatusBadgeUser(user.is_active)}
                    </div>

                    {/* Coluna Último Login */}
                    <div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(user.last_login), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </div>
                    </div>

                    {/* Coluna Ações */}
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Ações</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <UserProfileDrawer
                            user={user}
                            trigger={
                              <DropdownMenuItem 
                                onSelect={(e) =>  e.preventDefault()}
                                className="flex items-center"
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Perfil
                              </DropdownMenuItem>
                            }
                          />
                          <DropdownMenuItem className="flex items-center">
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="flex items-center">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Resetar Senha
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="flex items-center"
                            variant={user.is_active ? "warning" : "success"}
                          >
                            {user.is_active ? (
                              <UserX className="mr-2 h-4 w-4" />
                            ) : (
                              <UserCheck className="mr-2 h-4 w-4" />
                            )}
                            {user.is_active ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Resumo (seguindo padrão BaseModules) */}
          {users.length > 0 && (
            <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
              <span>
                Mostrando {users.length} usuários
              </span>
              <span>
                Total: {userStats.active} ativos, {userStats.admins} administradores
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};