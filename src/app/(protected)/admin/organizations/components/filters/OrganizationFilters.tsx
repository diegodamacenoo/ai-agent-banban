import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { Search, Filter } from 'lucide-react';
import type { OrganizationFilterProps } from '../../types';

/**
 * Componente de filtros para organizações
 * Inclui busca textual e filtros por tipo e status
 */
export const OrganizationFilters = ({
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
}: OrganizationFilterProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-4">
      <div className="flex-1">
        <Input
          placeholder="Buscar por razão social ou nome fantasia..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
      <div className="flex gap-2">
        {/* Filtro por tipo de cliente */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
              Tipo: {filterType === 'all' ? 'Todos' : filterType === 'custom' ? 'Custom' : 'Standard'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Filtrar por Tipo</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilterType('all')}>
              Todos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('custom')}>
              Custom
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType('standard')}>
              Standard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Filtro por status de implementação */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
              Status: {filterStatus === 'all' ? 'Todos' : filterStatus === 'complete' ? 'Completas' : 'Pendentes'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Filtrar por Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilterStatus('all')}>
              Todos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('complete')}>
              Completas
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('incomplete')}>
              Pendentes
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};