// React core
import Link from 'next/link';

// UI Components
import { TabsContent } from '@/shared/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';

// Icons
import {
  Building2,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Search,
} from 'lucide-react';

// Local components and hooks
import { OrganizationsSkeleton } from '../skeletons/OrganizationsPageSkeletons';
import { EditOrganizationSheet } from '../../[id]/components/EditOrganizationSheet';
import { useBadgeHelpers } from '../../hooks';

// Types
import type { Organization } from '../../types';

interface OrganizationsTabProps {
  activeTab: string;
  loading: boolean;
  isInitialLoad: boolean;
  organizations: Organization[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterType: 'all' | 'standard' | 'custom';
  setFilterType: (type: 'all' | 'standard' | 'custom') => void;
  filterStatus: 'all' | 'complete' | 'incomplete';
  setFilterStatus: (status: 'all' | 'complete' | 'incomplete') => void;
  onDelete: (id: string) => Promise<void>;
  onSuccess: () => void;
  deletingOrganization: string | null;
  error?: string | null;
  onRetry?: () => void;
}

/**
 * Componente da aba de Organizações
 * Lista organizações com filtros e ações de gestão
 */
export const OrganizationsTab = ({
  activeTab,
  loading,
  isInitialLoad,
  organizations,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  onDelete,
  onSuccess,
  deletingOrganization,
  error,
  onRetry,
}: OrganizationsTabProps) => {
  const {
    getModulesCount,
    getStatusBadge,
    getTypeBadge,
    getPendingRequestsBadge,
  } = useBadgeHelpers();

  // AIDEV-NOTE: Filtros gerenciados centralmente via props - sem duplicação de lógica

  if (isInitialLoad && loading) {
    return (
      <TabsContent value="organizations" activeValue={activeTab}>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Lista de Organizações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-48" />
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
    <TabsContent value="organizations" activeValue={activeTab}>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Lista de Organizações</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros integrados (seguindo padrão BaseModules) */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar organizações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="complete">Completo</SelectItem>
                <SelectItem value="incomplete">Incompleto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Tratamento de erro específico para organizações */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Erro ao carregar organizações</h4>
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
            <div className="md:grid md:grid-cols-[3fr_1fr_1fr_1fr_1fr_0.5fr] items-center px-4 py-3 text-sm text-muted-foreground">
              <div>Organização</div>
              <div>Tipo</div>
              <div>Pendências</div>
              <div>Módulos</div>
              <div>Status</div>
              <div></div>
            </div>

            {/* Corpo */}
            <div>
              {organizations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="flex flex-col items-center gap-2">
                    <Building2 className="h-8 w-8" />
                    <span>
                      {error 
                        ? 'Erro ao carregar organizações' 
                        : searchQuery || filterType !== 'all' || filterStatus !== 'all'
                          ? 'Nenhuma organização encontrada com os filtros aplicados.'
                          : 'Nenhuma organização encontrada'
                      }
                    </span>
                  </div>
                </div>
              ) : (
                organizations.map((organization) => {
                    const { assigned, total } = getModulesCount(organization);
                    return (
                      <div key={organization.id} className="md:grid md:grid-cols-[3fr_1fr_1fr_1fr_1fr_0.5fr] items-center px-4 py-3 rounded-lg hover:bg-[hsl(var(--secondary))] transition-colors">
                        
                        {/* Coluna Organização */}
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {organization.company_trading_name}
                          </span>
                          <span className="text-sm text-gray-500">
                            {organization.company_legal_name}
                          </span>
                        </div>

                        {/* Coluna Tipo */}
                        <div>
                          {getTypeBadge(organization.client_type)}
                        </div>

                        {/* Coluna Pendências */}
                        <div>
                          {getPendingRequestsBadge(organization) || (
                            <span className="text-sm text-zinc-500">-</span>
                          )}
                        </div>

                        {/* Coluna Módulos */}
                        <div>
                          <Badge variant="outline" className="w-fit">
                            {assigned}/{total} módulos
                          </Badge>
                        </div>

                        {/* Coluna Status */}
                        <div>
                          {getStatusBadge(organization)}
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
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/organizations/${organization.id}`} className="flex items-center">
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalhes
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="p-0 cursor-pointer">
                                <EditOrganizationSheet
                                  organization={organization}
                                  onSuccess={onSuccess}
                                  trigger={
                                    <div className="flex items-center px-2 py-1.5 text-sm w-full">
                                      <Edit className="mr-2 h-4 w-4" />
                                      Editar
                                    </div>
                                  }
                                />
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {/* Diálogo de confirmação para exclusão */}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-start px-2 py-1.5 text-sm font-normal text-red-600 hover:text-red-700 hover:bg-red-50"
                                    disabled={deletingOrganization === organization.id}
                                  >
                                    {deletingOrganization === organization.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="mr-2 h-4 w-4" />
                                    )}
                                    Excluir
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Você tem certeza?</DialogTitle>
                                    <DialogDescription>
                                      Essa ação não pode ser desfeita. Isso excluirá permanentemente a
                                      organização e todos os seus dados associados.
                                    </DialogDescription>
                                  </DialogHeader>
                                  <DialogFooter>
                                    <DialogClose asChild>
                                      <Button variant="outline">Cancelar</Button>
                                    </DialogClose>
                                    <Button
                                      onClick={() => onDelete(organization.id)}
                                      variant="destructive"
                                    >
                                      Confirmar Exclusão
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    );
                  })
                )}
            </div>
          </div>

          {/* Resumo (seguindo padrão BaseModules) */}
          {organizations.length > 0 && (
            <div className="flex justify-between items-center text-sm text-muted-foreground mt-4">
              <span>
                Mostrando {organizations.length} organizações
              </span>
              <span>
                {organizations.filter(org => org.client_type === 'custom').length} custom, {organizations.filter(org => org.is_implementation_complete).length} completas
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
};