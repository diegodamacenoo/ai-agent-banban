'use client';

import { useEffect, useState } from 'react';
import { getAllUsers, getUserStats } from '@/app/actions/admin/users';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  UserX,
  Filter,
  Crown,
  Shield,
  User,
  Building2,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreateUserSheet } from '@/features/admin/create-user-sheet';
import { Layout, AnalyticsCard, AnalyticsGrid } from '@/shared/components/Layout';
import { useToast } from '@/shared/ui/toast';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: 'master_admin' | 'organization_admin' | 'standard_user';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'DELETED';
  last_sign_in_at: string | null;
  created_at: string;
  job_title?: string;
  phone?: string;
  organizations: {
    id: string;
    company_trading_name: string;
    client_type: string;
  } | null;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  admins: number;
  recent: number;
}

export default function AdminUsersPage() {
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'master_admin' | 'organization_admin' | 'standard_user'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'DELETED'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadUsers();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchQuery, filterRole, filterStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getAllUsers();

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.data) {
        setUsers(result.data);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro inesperado ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await getUserStats();
      if (result.data) {
        setStats(result.data);
      }
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await Promise.all([loadUsers(), loadStats()]);
      toast.success("A lista foi atualizada com sucesso.", {
        title: "Dados atualizados",
      });
    } catch (err) {
      console.error('Erro ao atualizar usuários:', err);
      toast.error("Ocorreu um erro ao atualizar os dados.", {
        title: "Erro inesperado",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = users;

    // Filtro de busca
    if (searchQuery) {
      filtered = filtered.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.organizations?.company_trading_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filtro por role
    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole);
    }

    // Filtro por status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus);
    }

    setFilteredUsers(filtered);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'master_admin':
        return (
          <Badge variant="destructive">
            <Crown className="h-3 w-3 mr-1" />
            Master Admin
          </Badge>
        );
      case 'organization_admin':
        return (
          <Badge variant="default">
            <Shield className="h-3 w-3 mr-1" />
            Admin Org
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <User className="h-3 w-3 mr-1" />
            Usuário
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle className="h-3 w-3 mr-1" />
            Ativo
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="warning" className="bg-yellow-100 text-yellow-800">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case 'DELETED':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <Trash2 className="h-3 w-3 mr-1" />
            Excluído
          </Badge>
        );
      case 'INACTIVE':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800">
            <UserX className="h-3 w-3 mr-1" />
            Inativo
          </Badge>
        );
    }
  };

  // Configuração do layout
  const breadcrumbs = [
    { title: 'Usuários', href: '/admin/users' }
  ];

  return (
    <Layout
      loading={loading}
      error={error}
      onRetry={loadUsers}
    >
      <Layout.Header>
        <Layout.Breadcrumbs items={breadcrumbs} />
        <Layout.Actions>
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <CreateUserSheet onSuccess={loadUsers} />
        </Layout.Actions>
      </Layout.Header>
      <Layout.Body>
        <Layout.Content>
          {stats && (
            <AnalyticsGrid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <AnalyticsCard
                title="Total de Usuários"
                description="Todos os usuários no sistema"
                value={stats.total}
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
              />
              <AnalyticsCard
                title="Ativos"
                description="Usuários com atividade recente"
                value={stats.active}
                icon={<CheckCircle className="h-4 w-4 text-green-500" />}
                textColor="text-green-600"
              />
              <AnalyticsCard
                title="Inativos"
                description="Usuários sem atividade"
                value={stats.inactive}
                icon={<UserX className="h-4 w-4 text-gray-500" />}
              />
              <AnalyticsCard
                title="Suspensos"
                description="Usuários com acesso bloqueado"
                value={stats.suspended}
                icon={<AlertTriangle className="h-4 w-4 text-red-500" />}
                textColor="text-red-600"
              />
              <AnalyticsCard
                title="Admins"
                description="Usuários com privilégios"
                value={stats.admins}
                icon={<Shield className="h-4 w-4 text-blue-500" />}
              />
              <AnalyticsCard
                title="Novos (7 dias)"
                description="Usuários criados na última semana"
                value={stats.recent}
                icon={<Plus className="h-4 w-4 text-indigo-500" />}
              />
            </AnalyticsGrid>
          )}

          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Lista de Usuários</CardTitle>
                  <CardDescription>Gerencie todos os usuários do sistema.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Filter className="h-4 w-4" />
                        Filtrar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Filtrar por Cargo</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setFilterRole('all')}>Todos</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterRole('master_admin')}>Master Admin</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterRole('organization_admin')}>Admin de Organização</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterRole('standard_user')}>Usuário Padrão</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setFilterStatus('all')}>Todos</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterStatus('ACTIVE')}>Ativo</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterStatus('INACTIVE')}>Inativo</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterStatus('PENDING')}>Pendente</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setFilterStatus('DELETED')}>Excluído</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="mt-4">
                <Input
                  placeholder="Pesquisar por nome, email ou organização..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Organização</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead>
                      <span className="sr-only">Ações</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{`${user.first_name} ${user.last_name}`}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        {user.organizations ? (
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>{user.organizations.company_trading_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>
                        {user.last_sign_in_at
                          ? format(new Date(user.last_sign_in_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          : 'Nunca'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/users/${user.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar Usuário
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Deletar Usuário
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Layout.Content>
      </Layout.Body>
    </Layout>
  );
} 
