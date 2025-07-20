import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  Search,
  BarChart3,
  Plus,
  Filter,
  Tags,
  TrendingUp,
  TestTube,
  AlertTriangle,
  FileX,
  Settings,
  Archive
} from 'lucide-react';
import { MODULE_STATUS, STATUS_LABELS, TECHNICAL_TYPE_LABELS } from '../../constants/moduleConstants';
import { ModuleTechnicalType } from '@/shared/types/module-catalog';

interface ModuleFiltersProps {
  searchTerm: string;
  selectedStatus: string;
  selectedTechnicalType?: string;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTechnicalTypeChange?: (value: string) => void;
}

export function ModuleFilters({
  searchTerm,
  selectedStatus,
  selectedTechnicalType = 'all',
  onSearchChange,
  onStatusChange,
  onTechnicalTypeChange
}: ModuleFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Search Bar and Action Buttons */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar módulos, organizações, status..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button variant="outline" className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Analytics Global
        </Button>

        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo
        </Button>
      </div>

      {/* Status Filter and Quick Badges */}
      <div className="flex items-center gap-2">
        <Select
          value={selectedStatus}
          onValueChange={onStatusChange}
        >
          <SelectTrigger className="w-fit" icon={Filter}>
            <SelectValue placeholder="Selecione um status" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por Tipo Técnico */}
        {onTechnicalTypeChange && (
          <Select
            value={selectedTechnicalType}
            onValueChange={onTechnicalTypeChange}
          >
            <SelectTrigger className="w-fit">
              <SelectValue placeholder="Tipo Técnico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              {Object.entries(TECHNICAL_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <div className="flex items-center gap-1">
          <Badge 
            variant={selectedStatus === MODULE_STATUS.ALL ? "secondary" : "outline"} 
            className="cursor-pointer flex items-center gap-1"
            onClick={() => onStatusChange(MODULE_STATUS.ALL)}
          >
            <Tags className="h-3 w-3" />
            Todos
          </Badge>
          <Badge 
            variant={selectedStatus === MODULE_STATUS.ACTIVE ? "secondary" : "outline"} 
            className="cursor-pointer flex items-center gap-1"
            onClick={() => onStatusChange(MODULE_STATUS.ACTIVE)}
          >
            <TrendingUp className="h-3 w-3" />
            Ativos
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer flex items-center gap-1"
          >
            <TestTube className="h-3 w-3" />
            Beta
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer flex items-center gap-1"
          >
            <AlertTriangle className="h-3 w-3" />
            Problemas
          </Badge>
          <Badge 
            variant={selectedStatus === MODULE_STATUS.ORPHANED ? "secondary" : "outline"} 
            className="cursor-pointer flex items-center gap-1"
            onClick={() => onStatusChange(MODULE_STATUS.ORPHANED)}
          >
            <FileX className="h-3 w-3" />
            Órfãos
          </Badge>
          <Badge 
            variant={selectedStatus === MODULE_STATUS.ARCHIVED ? "secondary" : "outline"} 
            className="cursor-pointer flex items-center gap-1"
            onClick={() => onStatusChange(MODULE_STATUS.ARCHIVED)}
          >
            <Archive className="h-3 w-3" />
            Arquivados
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer flex items-center gap-1"
          >
            <Settings className="h-3 w-3" />
            Manutenção
          </Badge>
        </div>
      </div>
    </div>
  );
}