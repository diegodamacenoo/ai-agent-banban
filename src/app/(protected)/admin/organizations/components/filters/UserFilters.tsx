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
import type { UserFilterProps } from '../../types';

/**
 * Componente de filtros para usuários
 * Inclui busca textual e filtro por role
 */
export const UserFilters = ({
  searchQuery,
  setSearchQuery,
  filterRole,
  setFilterRole,
}: UserFilterProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-2 pt-4">
      <div className="flex-1">
        <Input
          placeholder="Buscar por nome, email ou organização..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="h-4 w-4 text-muted-foreground" />}
        />
      </div>
      <div className="flex gap-2">
        {/* Filtro por role */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" leftIcon={<Filter className="h-4 w-4" />}>
              Role: {filterRole === 'all' ? 'Todos' : 
                     filterRole === 'admin' ? 'Administradores' :
                     filterRole === 'manager' ? 'Gestores' : 'Usuários'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Filtrar por Role</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setFilterRole('all')}>
              Todos
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterRole('admin')}>
              Administradores
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterRole('manager')}>
              Gestores
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterRole('user')}>
              Usuários
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};