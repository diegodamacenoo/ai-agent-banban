import { useMemo, useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Database,
  Table as TableIcon,
  Building,
  LayoutGrid,
  Factory,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { CoreModule } from '@/shared/types/module-catalog';
import { OrphanModule } from '@/shared/types/module-system';
import { ModuleAdoptionData } from '../../../hooks/useModuleData';
import { ModuleTableRow } from '../../shared';
import { ModuleFilters } from '../ModuleFilters';
import { ExecutiveDashboard } from '../../analytics/ExecutiveDashboard';
import { useModuleStats } from '../../../hooks/useModuleStats';
import { filterModules } from '../../../utils/moduleHelpers';
import { MODULE_STATUS, TABLE_CONFIG } from '../../../constants/moduleConstants';

interface ModuleCatalogTableProps {
  modules: CoreModule[];
  orphanModules: OrphanModule[];
  adoptionData: Record<string, ModuleAdoptionData>;
  loading: boolean;
  onArchive: (moduleId: string) => Promise<void>;
  onUnarchive: (moduleId: string) => Promise<void>;
  onMaturityChange: (moduleId: string, newMaturity: any) => Promise<void>;
  onDelete?: (moduleId: string) => Promise<void>;
}

export function ModuleCatalogTable({
  modules,
  orphanModules,
  adoptionData,
  loading,
  onArchive,
  onUnarchive,
  onMaturityChange,
  onDelete
}: ModuleCatalogTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(MODULE_STATUS.ALL);
  const [selectedTechnicalType, setSelectedTechnicalType] = useState<string>('all');
  const [groupByMode, setGroupByMode] = useState<'none' | 'client' | 'functional' | 'industry'>('client');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const { executiveStats } = useModuleStats(modules, adoptionData, orphanModules);

  // Funções auxiliares para agrupamento
  const getGroupLabel = (key: string) => {
    const labelMaps = {
      'single-client': 'Específicos por Cliente',
      'multi-client': 'Multi-Cliente', 
      'client-agnostic': 'Independente de Cliente',
      'analytics': 'Analytics',
      'inventory': 'Estoque',
      'alerts': 'Alertas',
      'performance': 'Performance',
      'reports': 'Relatórios',
      'integrations': 'Integrações',
      'workflows': 'Workflows',
      'standard': 'Padrão',
      'fashion': 'Moda',
      'retail': 'Varejo',
      'manufacturing': 'Manufatura',
      'logistics': 'Logística',
      'generic': 'Genérico',
      'banban': 'BanBan',
      'riachuelo': 'Riachuelo',
      'ca': 'CA'
    };
    return labelMaps[key as keyof typeof labelMaps] || key;
  };

  const getGroupIcon = (key: string) => {
    // Retorna o componente de ícone apropriado baseado na chave
    const iconMaps = {
      'banban': '🏢',
      'riachuelo': '🏢', 
      'ca': '🏢',
      'multi-client': '👥',
      'client-agnostic': '📦',
      'analytics': '📊',
      'inventory': '📦',
      'alerts': '🔔',
      'performance': '⚡',
      'reports': '📄',
      'integrations': '🔌',
      'workflows': '⚙️',
      'standard': '⚙️',
      'fashion': '👗',
      'retail': '🏪',
      'manufacturing': '🏭',
      'logistics': '🚚',
      'generic': '⚙️'
    };
    return iconMaps[key as keyof typeof iconMaps] || '📁';
  };

  // Filtrar módulos baseado no status selecionado, tipo técnico e termo de busca
  const filteredModules = useMemo(() => {
    return filterModules(modules, searchTerm, selectedStatus, orphanModules, selectedTechnicalType);
  }, [modules, searchTerm, selectedStatus, orphanModules, selectedTechnicalType]);

  // Agrupar módulos para visualização na tabela
  const groupedTableData = useMemo(() => {
    if (groupByMode === 'none') {
      return filteredModules.map(module => ({ type: 'module', data: module }));
    }

    const groups: Record<string, CoreModule[]> = {};
    
    filteredModules.forEach(module => {
      let groupKey: string;
      
      switch (groupByMode) {
        case 'client':
          groupKey = module.client_scope === 'single-client' 
            ? module.primary_client || 'unknown'
            : module.client_scope;
          break;
        case 'functional':
          groupKey = module.functional_category;
          break;
        case 'industry':
          groupKey = module.industry_vertical;
          break;
        default:
          groupKey = 'unknown';
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(module);
    });

    // Converter grupos em estrutura de tabela
    const tableData: Array<{ type: 'group' | 'module', data: any }> = [];
    
    Object.entries(groups).forEach(([groupKey, groupModules]) => {
      // Adicionar linha de cabeçalho do grupo
      tableData.push({
        type: 'group',
        data: {
          key: groupKey,
          label: getGroupLabel(groupKey),
          count: groupModules.length,
          icon: getGroupIcon(groupKey),
          collapsed: collapsedGroups.has(groupKey)
        }
      });
      
      // Adicionar módulos do grupo (se não estiver colapsado)
      if (!collapsedGroups.has(groupKey)) {
        groupModules.forEach(module => {
          tableData.push({
            type: 'module',
            data: module
          });
        });
      }
    });

    return tableData;
  }, [filteredModules, groupByMode, collapsedGroups]);

  // Toggle grupo colapsado/expandido
  const toggleGroup = (groupKey: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  if (loading) {
    return <div className="text-center py-8">Carregando catálogo de módulos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Executive Dashboard */}
      <ExecutiveDashboard stats={executiveStats} />

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <ModuleFilters
            searchTerm={searchTerm}
            selectedStatus={selectedStatus}
            selectedTechnicalType={selectedTechnicalType}
            onSearchChange={setSearchTerm}
            onStatusChange={setSelectedStatus}
            onTechnicalTypeChange={setSelectedTechnicalType}
          />
          
          {/* Group By Selector */}
          <Select
            value={groupByMode}
            onValueChange={(value: 'none' | 'client' | 'functional' | 'industry') => setGroupByMode(value)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <TableIcon className="h-4 w-4" />
                  Sem Agrupamento
                </div>
              </SelectItem>
              <SelectItem value="client">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Agrupar por Cliente
                </div>
              </SelectItem>
              <SelectItem value="functional">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Agrupar por Função
                </div>
              </SelectItem>
              <SelectItem value="industry">
                <div className="flex items-center gap-2">
                  <Factory className="h-4 w-4" />
                  Agrupar por Setor
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="w-full overflow-auto">
        <div style={{ minWidth: TABLE_CONFIG.MIN_WIDTH }}>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className={TABLE_CONFIG.COLUMNS.MODULE}>Módulo</TableHead>
                <TableHead className={TABLE_CONFIG.COLUMNS.STATUS}>Status</TableHead>
                <TableHead className={TABLE_CONFIG.COLUMNS.HEALTH}>Saúde</TableHead>
                <TableHead className={TABLE_CONFIG.COLUMNS.ADOPTION}>Adoção</TableHead>
                <TableHead className={TABLE_CONFIG.COLUMNS.PERFORMANCE}>Performance</TableHead>
                <TableHead className={TABLE_CONFIG.COLUMNS.AVAILABILITY}>Disponível</TableHead>
                <TableHead className={TABLE_CONFIG.COLUMNS.ALERTS}>Alertas</TableHead>
                <TableHead className={`${TABLE_CONFIG.COLUMNS.ACTIONS} text-right`}></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedTableData.map((row, index) => {
                if (row.type === 'group') {
                  const groupData = row.data;
                  return (
                    <TableRow 
                      key={`group-${groupData.key}`} 
                      className="bg-muted/30 hover:bg-muted/50 border-b-2"
                    >
                      <TableCell 
                        colSpan={8} 
                        className="font-semibold text-sm py-3"
                      >
                        <button
                          onClick={() => toggleGroup(groupData.key)}
                          className="flex items-center gap-2 w-full text-left hover:text-foreground/80 transition-colors"
                        >
                          {groupData.collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                          <span className="text-lg">{groupData.icon}</span>
                          <span>{groupData.label}</span>
                          <Badge variant="outline" size="sm" className="ml-2">
                            {groupData.count} módulos
                          </Badge>
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                } else {
                  // Linha de módulo normal
                  return (
                    <ModuleTableRow
                      key={row.data.id}
                      module={row.data}
                      adoptionData={adoptionData}
                      orphanModules={orphanModules}
                      onArchive={onArchive}
                      onUnarchive={onUnarchive}
                      onMaturityChange={onMaturityChange}
                      onDelete={onDelete}
                      isGrouped={groupByMode !== 'none'}
                    />
                  );
                }
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination and Summary */}
      <div className="flex items-center justify-between p-4 border-t">
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <Database className="h-4 w-4" />
          Mostrando {filteredModules.length} de {modules.length} módulos
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>
          <Button variant="outline" size="sm">
            <ArrowRight className="h-4 w-4 mr-1" />
            Próximo
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-1" />
            Ver Analytics Global
          </Button>
        </div>
      </div>
    </div>
  );
}