'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Crown,
  User,
  Mail,
  Calendar,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/card';
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
import { Skeleton } from '@/shared/ui/skeleton';
import { useToast } from '@/shared/ui/toast';
import {
  getUsersByOrganization,
  deactivateUserFromOrganization,
  reactivateUser,
  permanentlyDeleteUser
} from '@/app/actions/admin/organization-users';
import { CreateUserSheet } from '@/features/admin/create-user-sheet';
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from "@/shared/ui/modal";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  role: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'DELETED';
  job_title?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  last_sign_in_at?: string;
}

interface UsersTabProps {
  organizationId: string;
  stats: {
    total_users: number;
    active_users: number;
    inactive_users: number;
    suspended_users: number;
  };
}

export function UsersTab({ organizationId, stats }: UsersTabProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'master_admin' | 'organization_admin' | 'authenticated'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'DELETED'>('all');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [permanentDeleting, setPermanentDeleting] = useState(false);
  const { toast } = useToast();

  // Carregar usuários
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getUsersByOrganization(organizationId);

      if (result.error) {
        setError(result.error);
        toast.error(result.error, {
          title: 'Erro ao carregar usuários',
        });
        return;
      }

      if (result.data) {
        setUsers(result.data);
      }
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro inesperado ao carregar usuários');
      toast.error('Não foi possível carregar os usuários', {
        title: 'Erro inesperado',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [organizationId]);

  // Filtrar usuários
  const filteredUsers = useMemo(() => {
    let filtered = [...users];

    // Filtro de busca
    if (searchQuery) {
      filtered = filtered.filter(user =>
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.job_title?.toLowerCase().includes(searchQuery.toLowerCase())
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

    return filtered;
  }, [users, searchQuery, filterRole, filterStatus]);

  // Badges de role
  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'master_admin':
        return (
          <Badge variant="destructive" icon={Crown} className="w-fit">
            Master Admin
          </Badge>
        );
      case 'organization_admin':
        return (
          <Badge variant="default" icon={Shield} className="w-fit">
            Admin Org
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" icon={User} className="w-fit">
            Usuário
          </Badge>
        );
    }
  };

  // Badges de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-600 w-fit" icon={UserCheck}>
            Ativo
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="text-zinc-600 border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:text-zinc-600 w-fit" icon={UserX}>
            Inativo
          </Badge>
        );
      case 'suspended':
        return (
          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-600 w-fit" icon={AlertTriangle}>
            Suspenso
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            {status}
          </Badge>
        );
    }
  };

  // Handlers
  const handleOpenDeleteDialog = (user: User) => {
    setUserToDelete(user);
    setShowDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    if (!deleting && !permanentDeleting) {
      setShowDeleteDialog(false);
      setUserToDelete(null);
    }
  };

  const handleDeactivateUser = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(true);
      const result = await deactivateUserFromOrganization(userToDelete.id, organizationId);

      if (result.error) {
        toast.error(result.error, {
          title: "Erro ao desativar usuário",
        });
        return;
      }

      toast.success("O usuário foi desativado com sucesso.", {
        title: "Usuário desativado",
      });

      loadUsers();
    } catch (err) {
      console.error('Erro ao desativar usuário:', err);
      toast.error("Ocorreu um erro ao tentar desativar o usuário.", {
        title: "Erro inesperado",
      });
    } finally {
      setDeleting(false);
      handleCloseDeleteDialog();
    }
  };

  const handlePermanentDelete = async () => {
    if (!userToDelete) return;

    try {
      setPermanentDeleting(true);
      const result = await permanentlyDeleteUser(userToDelete.id, organizationId);

      if (result.error) {
        toast.error(result.error, {
          title: "Erro ao deletar usuário",
        });
        return;
      }

      toast.success("O usuário foi deletado permanentemente.", {
        title: "Usuário deletado",
      });

      loadUsers();
    } catch (err) {
      console.error('Erro ao deletar usuário:', err);
      toast.error("Ocorreu um erro ao tentar deletar o usuário.", {
        title: "Erro inesperado",
      });
    } finally {
      setPermanentDeleting(false);
      handleCloseDeleteDialog();
    }
  };

  const handleReactivateUser = async (user: User) => {
    try {
      const result = await reactivateUser(user.id, organizationId);

      if (result.error) {
        toast.error(result.error, {
          title: "Erro ao reativar usuário",
        });
        return;
      }

      toast.success("O usuário foi reativado com sucesso.", {
        title: "Usuário reativado",
      });

      loadUsers();
    } catch (err) {
      console.error('Erro ao reativar usuário:', err);
      toast.show({ title: "Erro inesperado",
        description: "Ocorreu um erro ao tentar reativar o usuário.",
        variant: "destructive",
      });
    }
  };

  // Estados de loading
  if (loading) {
    return (
      <div className="space-y-4">
        {/* Filters Loading */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Table Loading */}
        <Card variant="default" size="sm">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="default" size="sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive mb-4">
            <AlertTriangle className="h-5 w-5" />
            <span>{error}</span>
          </div>
          <Button onClick={loadUsers} variant="outline">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Input
              placeholder="Buscar por nome, email ou cargo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
                Role: {filterRole === 'all' ? 'Todos' : filterRole}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filtrar por Role</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterRole('all')}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRole('master_admin')}>
                Master Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRole('organization_admin')}>
                Admin Org
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterRole('authenticated')}>
                Usuário
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
                Status: {filterStatus === 'all' ? 'Todos' : filterStatus}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                Todos
              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setFilterStatus('ACTIVE')}>
                  Ativos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('INACTIVE')}>
                  Inativos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('PENDING')}>
                  Pendentes
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('DELETED')}>
                  Excluídos
                </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Último Login</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-zinc-500">
                    <User className="h-8 w-8" />
                    <span>
                      {searchQuery ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className={user.status === 'INACTIVE' ? 'opacity-60 bg-zinc-50' : ''}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${user.status === 'INACTIVE'
                          ? 'bg-zinc-300'
                          : 'bg-zinc-200'
                        }`}>
                        <User className={`h-4 w-4 ${user.status === 'INACTIVE'
                            ? 'text-zinc-500'
                            : 'text-zinc-600'
                          }`} />
                      </div>
                      <div>
                        <div className={`font-medium ${user.status === 'INACTIVE'
                            ? 'text-zinc-500 line-through'
                            : ''
                          }`}>
                          {user.first_name} {user.last_name}
                          {user.status === 'INACTIVE' && (
                            <span className="ml-2 text-xs text-red-500 font-normal">
                              (Desativado)
                            </span>
                          )}
                        </div>
                        {user.job_title && (
                          <div className={`text-sm ${user.status === 'INACTIVE'
                              ? 'text-zinc-400'
                              : 'text-muted-foreground'
                            }`}>
                            {user.job_title}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {user.email || 'N/A'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {user.last_sign_in_at ? (
                        format(new Date(user.last_sign_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      ) : (
                        'Nunca'
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0" leftIcon={<MoreHorizontal className="h-4 w-4" />}>
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem icon={Eye}>
                          Visualizar
                        </DropdownMenuItem>
                        {user.status !== 'INACTIVE' && (
                          <DropdownMenuItem icon={Edit}>
                            Editar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        {user.status === 'INACTIVE' ? (
                          <DropdownMenuItem icon={UserCheck} variant="default" onClick={() => handleReactivateUser(user)}>
                            Reativar
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem icon={UserX} variant="destructive" onClick={() => handleOpenDeleteDialog(user)}>
                            Desativar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Confirmação */}
      <Modal open={showDeleteDialog} onOpenChange={handleCloseDeleteDialog}>
        <ModalContent>
          <ModalHeader>
            <ModalTitle>Gerenciar Usuário</ModalTitle>
            <ModalDescription>
              Escolha uma ação para o usuário{' '}
              <span className="font-semibold">
                {userToDelete?.first_name} {userToDelete?.last_name}
              </span>
              :
            </ModalDescription>
          </ModalHeader>
          <ModalFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2 w-full sm:w-auto">
              {/* Botão de Deletar Permanentemente - À esquerda */}
              <Button
                variant="destructive"
                onClick={handlePermanentDelete}
                disabled={deleting || permanentDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {permanentDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deletando...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar Permanentemente
                  </>
                )}
              </Button>
            </div>

            <div className="flex gap-2 w-full sm:w-auto sm:ml-auto">
              <Button
                variant="outline"
                onClick={handleCloseDeleteDialog}
                disabled={deleting || permanentDeleting}
              >
                Cancelar
              </Button>
              <Button
                variant="secondary"
                onClick={handleDeactivateUser}
                disabled={deleting || permanentDeleting}
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Desativando...
                  </>
                ) : (
                  <>
                    <UserX className="h-4 w-4 mr-2" />
                    Desativar
                  </>
                )}
              </Button>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
} 