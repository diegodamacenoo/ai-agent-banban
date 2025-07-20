import { useMemo, useState, useCallback } from 'react';
import { TreeProvider, Tree, TreeItem } from '@/shared/ui/tree';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/shared/ui/select';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell
} from '@/shared/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import {
  Building,
  Users,
  Factory,
  Package,
  BarChart3,
  AlertTriangle,
  Settings,
  Zap,
  FileText,
  Plug,
  Workflow,
  Monitor,
  Server,
  Laptop,
  Database,
  Bot,
  LayoutGrid,
  Info,
  Archive
} from 'lucide-react';
import { CoreModule } from '@/shared/types/module-catalog';
import { OrphanModule } from '@/shared/types/module-system';
import { ModuleAdoptionData } from '../../hooks/useModuleData';
import { ModuleActionsMenu } from '../shared/menus/ModuleActionsMenu';
import { cn } from "@/lib/utils";
import {
  TECHNICAL_TYPE_ICONS,
  TECHNICAL_TYPE_LABELS,
  TABLE_CONFIG
} from '../../constants/moduleConstants';
import {
  isModuleOrphan,
  calculateModuleHealth,
  calculateModuleAdoption,
  calculateModulePerformance,
  calculateModuleAvailability,
  calculateModuleAlerts,
  getStatusLabel,
  getStatusIconColor
} from '../../utils/moduleHelpers';

interface ModuleTreeTableProps {
  modules: CoreModule[];
  orphanModules: OrphanModule[];
  adoptionData: Record<string, ModuleAdoptionData>;
  loading: boolean;
  onArchive: (moduleId: string) => Promise<void>;
  onUnarchive: (moduleId: string) => Promise<void>;
  onMaturityChange: (moduleId: string, newMaturity: any) => Promise<void>;
  onDelete?: (moduleId: string) => Promise<void>;
}

// Organizational view types
type OrganizationView = 'client' | 'functional' | 'industry';

// Icon mappings for different categories
const CLIENT_ICONS = {
  'banban': Building,
  'riachuelo': Building,
  'ca': Building,
  'multi-client': Users,
  'client-agnostic': Package
};

const FUNCTIONAL_ICONS = {
  'analytics': BarChart3,
  'inventory': Package,
  'alerts': AlertTriangle,
  'performance': Zap,
  'reports': FileText,
  'integrations': Plug,
  'workflows': Workflow,
  'standard': Settings
};

const INDUSTRY_ICONS = {
  'fashion': Factory,
  'retail': Building,
  'manufacturing': Factory,
  'logistics': Package,
  'generic': Settings
};

// Custom TreeItem component for table-like rows
interface TreeTableItemProps {
  module?: CoreModule;
  groupLabel?: string;
  groupIcon?: any;
  groupCount?: number;
  level: number;
  nodeId: string;
  hasChildren?: boolean;
  adoptionData?: Record<string, ModuleAdoptionData>;
  orphanModules?: OrphanModule[];
  onArchive?: (moduleId: string) => Promise<void>;
  onUnarchive?: (moduleId: string) => Promise<void>;
  onMaturityChange?: (moduleId: string, newMaturity: any) => Promise<void>;
  onDelete?: (moduleId: string) => Promise<void>;
  children?: React.ReactNode;
}

function TreeTableItem({
  module,
  groupLabel,
  groupIcon: GroupIcon,
  groupCount,
  level,
  nodeId,
  hasChildren = false,
  adoptionData = {},
  orphanModules = [],
  onArchive,
  onUnarchive,
  onMaturityChange,
  onDelete,
  children
}: TreeTableItemProps) {
  const isModule = !!module;
  
  // Calculate module metrics if it's a module row
  const orphanData = isModule ? isModuleOrphan(module.id, orphanModules) : null;
  const health = isModule ? calculateModuleHealth(module, orphanModules) : null;
  const adoption = isModule ? calculateModuleAdoption(module.id, adoptionData) : null;
  const performance = isModule ? calculateModulePerformance(module, orphanModules) : null;
  const availability = isModule ? calculateModuleAvailability(module, orphanModules) : null;
  const alerts = isModule ? calculateModuleAlerts(module, orphanModules) : null;

  return (
    <TreeItem
      nodeId={nodeId}
      level={level}
      hasChildren={hasChildren}
      label={
        <div className="flex items-center w-full min-w-0" style={{ paddingLeft: level * 20 }}>
          {/* Module/Group Name Column */}
          <div className={cn("flex items-center gap-2 min-w-0", TABLE_CONFIG.COLUMNS.MODULE)}>
            {GroupIcon && <GroupIcon className="h-4 w-4 flex-shrink-0" />}
            
            {isModule ? (
              <>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-medium truncate">{module.name}</span>
                  
                  {/* Technical Type Badge */}
                  {module.technical_type && (
                    <Badge variant="outline" size="sm">
                      {(() => {
                        const TechnicalIcon = TECHNICAL_TYPE_ICONS[module.technical_type];
                        return TechnicalIcon ? <TechnicalIcon className="w-3 h-3" /> : null;
                      })()}
                      {TECHNICAL_TYPE_LABELS[module.technical_type]}
                    </Badge>
                  )}
                  
                  {/* Archived Badge */}
                  {module.is_archived && (
                    <Badge variant="light_warning" size="sm">
                      <Archive className="w-3 h-3 mr-1" />
                      Arquivado
                    </Badge>
                  )}
                  
                  {/* Info Tooltip */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="text-sm font-medium">{module.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {module.description}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </>
            ) : (
              <>
                <span className="font-semibold">{groupLabel}</span>
                {groupCount && (
                  <Badge variant="outline" size="sm">
                    {groupCount}
                  </Badge>
                )}
              </>
            )}
          </div>

          {/* Status Column */}
          <div className={cn("flex items-center", TABLE_CONFIG.COLUMNS.STATUS)}>
            {isModule && module.maturity_status && (
              <Badge variant="outline" className="text-xs">
                {getStatusLabel(module.maturity_status)}
              </Badge>
            )}
          </div>

          {/* Health Column */}
          <div className={cn("flex items-center", TABLE_CONFIG.COLUMNS.HEALTH)}>
            {isModule && health && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <health.icon className={`h-3 w-3 ${health.color}`} />
                      <span className="text-xs font-medium">{health.percentage}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm font-medium">{health.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Adoption Column */}
          <div className={cn("flex items-center", TABLE_CONFIG.COLUMNS.ADOPTION)}>
            {isModule && adoption && adoption.hasData && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <adoption.icon className={`h-3 w-3 ${adoption.color}`} />
                      <span className="text-xs font-medium">{adoption.percentage}%</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm font-medium">{adoption.percentage}% - {adoption.activeOrganizations} organizações</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Performance Column */}
          <div className={cn("flex items-center", TABLE_CONFIG.COLUMNS.PERFORMANCE)}>
            {isModule && performance && (
              <div className="flex items-center gap-1">
                <performance.icon className={`h-3 w-3 ${performance.color}`} />
                <span className="text-xs font-medium">{performance.status}</span>
              </div>
            )}
          </div>

          {/* Availability Column */}
          <div className={cn("flex items-center", TABLE_CONFIG.COLUMNS.AVAILABILITY)}>
            {isModule && availability && (
              <div className="flex items-center gap-1">
                <availability.icon className={`h-3 w-3 ${availability.color}`} />
                <span className="text-xs">{availability.status}</span>
              </div>
            )}
          </div>

          {/* Alerts Column */}
          <div className={cn("flex items-center", TABLE_CONFIG.COLUMNS.ALERTS)}>
            {isModule && alerts && alerts.type !== 'none' && (
              <div className="flex items-center gap-1">
                <alerts.icon className={`h-3 w-3 ${alerts.color}`} />
                <span className="text-xs font-medium">{alerts.label}</span>
              </div>
            )}
          </div>

          {/* Actions Column */}
          <div className={cn("flex items-center justify-end", TABLE_CONFIG.COLUMNS.ACTIONS)}>
            {isModule && (
              <ModuleActionsMenu
                module={module}
                isOrphan={!!orphanData}
                onArchive={onArchive!}
                onUnarchive={onUnarchive!}
                onMaturityChange={onMaturityChange!}
                onDelete={onDelete}
              />
            )}
          </div>
        </div>
      }
    >
      {children}
    </TreeItem>
  );
}

export function ModuleTreeTable({
  modules,
  orphanModules,
  adoptionData,
  loading,
  onArchive,
  onUnarchive,
  onMaturityChange,
  onDelete
}: ModuleTreeTableProps) {
  const [organizationView, setOrganizationView] = useState<OrganizationView>('client');
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);

  // Handler for node expansion - usando useCallback para evitar re-renders
  const handleNodeExpand = useCallback((nodeId: string, expanded: boolean) => {
    if (expanded) {
      setExpandedNodes(prev => [...prev, nodeId]);
    } else {
      setExpandedNodes(prev => prev.filter(id => id !== nodeId));
    }
  }, []);

  // Group modules based on the selected organization view
  const groupedModules = useMemo(() => {
    const groups: Record<string, Record<string, CoreModule[]>> = {};

    modules.forEach(module => {
      let primaryKey: string;
      let secondaryKey: string;

      switch (organizationView) {
        case 'client':
          primaryKey = module.client_scope === 'single-client' 
            ? module.primary_client || 'unknown'
            : module.client_scope;
          secondaryKey = module.functional_category;
          break;
        case 'functional':
          primaryKey = module.functional_category;
          secondaryKey = module.client_scope === 'single-client' 
            ? module.primary_client || 'unknown'
            : module.client_scope;
          break;
        case 'industry':
          primaryKey = module.industry_vertical;
          secondaryKey = module.functional_category;
          break;
        default:
          primaryKey = 'unknown';
          secondaryKey = 'unknown';
      }

      if (!groups[primaryKey]) groups[primaryKey] = {};
      if (!groups[primaryKey][secondaryKey]) groups[primaryKey][secondaryKey] = [];
      
      groups[primaryKey][secondaryKey].push(module);
    });

    return groups;
  }, [modules, organizationView]);

  // Get appropriate icon for a group
  const getGroupIcon = (key: string, level: 'primary' | 'secondary') => {
    if (level === 'primary') {
      switch (organizationView) {
        case 'client':
          return CLIENT_ICONS[key as keyof typeof CLIENT_ICONS] || Building;
        case 'functional':
          return FUNCTIONAL_ICONS[key as keyof typeof FUNCTIONAL_ICONS] || Settings;
        case 'industry':
          return INDUSTRY_ICONS[key as keyof typeof INDUSTRY_ICONS] || Factory;
      }
    } else {
      switch (organizationView) {
        case 'client':
          return FUNCTIONAL_ICONS[key as keyof typeof FUNCTIONAL_ICONS] || Settings;
        case 'functional':
          return CLIENT_ICONS[key as keyof typeof CLIENT_ICONS] || Building;
        case 'industry':
          return FUNCTIONAL_ICONS[key as keyof typeof FUNCTIONAL_ICONS] || Settings;
      }
    }
    return Settings;
  };

  // Get display label for groups
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

  if (loading) {
    return <div className="text-center py-8">Carregando catálogo de módulos...</div>;
  }

  return (
    <div className="space-y-4">
      {/* View Selector */}
      <div className="flex items-center gap-4">
        <Select
          value={organizationView}
          onValueChange={(value: OrganizationView) => setOrganizationView(value)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Por Cliente
              </div>
            </SelectItem>
            <SelectItem value="functional">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4" />
                Por Função
              </div>
            </SelectItem>
            <SelectItem value="industry">
              <div className="flex items-center gap-2">
                <Factory className="h-4 w-4" />
                Por Setor
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm">
          Expandir Todos
        </Button>
        
        <Button variant="outline" size="sm">
          Recolher Todos
        </Button>
      </div>

      {/* Table Header */}
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
                <TableHead className={`${TABLE_CONFIG.COLUMNS.ACTIONS} text-right`}>Ações</TableHead>
              </TableRow>
            </TableHeader>
          </Table>

          {/* Tree Content */}
          <TreeProvider
            defaultExpandedIds={expandedNodes}
            onNodeExpand={handleNodeExpand}
            showLines={true}
            showIcons={false}
            selectable={false}
            className="border-0 bg-transparent shadow-none mt-2"
          >
            <Tree>
              {Object.entries(groupedModules).map(([primaryKey, secondaryGroups]) => {
                const PrimaryIcon = getGroupIcon(primaryKey, 'primary');
                const primaryCount = Object.values(secondaryGroups).flat().length;
                
                return (
                  <TreeTableItem
                    key={primaryKey}
                    nodeId={primaryKey}
                    groupLabel={getGroupLabel(primaryKey)}
                    groupIcon={PrimaryIcon}
                    groupCount={primaryCount}
                    level={0}
                    hasChildren={true}
                  >
                    {Object.entries(secondaryGroups).map(([secondaryKey, moduleList]) => {
                      const SecondaryIcon = getGroupIcon(secondaryKey, 'secondary');
                      
                      return (
                        <TreeTableItem
                          key={`${primaryKey}-${secondaryKey}`}
                          nodeId={`${primaryKey}-${secondaryKey}`}
                          groupLabel={getGroupLabel(secondaryKey)}
                          groupIcon={SecondaryIcon}
                          groupCount={moduleList.length}
                          level={1}
                          hasChildren={true}
                        >
                          {moduleList.map((module) => (
                            <TreeTableItem
                              key={module.id}
                              nodeId={module.id}
                              module={module}
                              level={2}
                              hasChildren={false}
                              adoptionData={adoptionData}
                              orphanModules={orphanModules}
                              onArchive={onArchive}
                              onUnarchive={onUnarchive}
                              onMaturityChange={onMaturityChange}
                              onDelete={onDelete}
                            />
                          ))}
                        </TreeTableItem>
                      );
                    })}
                  </TreeTableItem>
                );
              })}
            </Tree>
          </TreeProvider>
        </div>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Mostrando {modules.length} módulos organizados por {
          organizationView === 'client' ? 'cliente' :
          organizationView === 'functional' ? 'função' : 'setor'
        }
      </div>
    </div>
  );
}