import { useMemo, useState } from 'react';
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
  LayoutGrid
} from 'lucide-react';
import { CoreModule } from '@/shared/types/module-catalog';
import { OrphanModule } from '@/shared/types/module-system';
import { ModuleAdoptionData } from '../../hooks/useModuleData';
import { ModuleTableRow } from '../shared/tables/ModuleTableRow';
import {
  TECHNICAL_TYPE_ICONS,
  TECHNICAL_TYPE_LABELS
} from '../../constants/moduleConstants';

interface ModuleTreeViewProps {
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

export function ModuleTreeView({
  modules,
  orphanModules,
  adoptionData,
  loading,
  onArchive,
  onUnarchive,
  onMaturityChange,
  onDelete
}: ModuleTreeViewProps) {
  const [organizationView, setOrganizationView] = useState<OrganizationView>('client');
  const [expandedNodes, setExpandedNodes] = useState<string[]>([]);

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
      // Secondary level icons
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
      // Client scope labels
      'single-client': 'Específicos por Cliente',
      'multi-client': 'Multi-Cliente',
      'client-agnostic': 'Independente de Cliente',
      
      // Functional category labels
      'analytics': 'Analytics',
      'inventory': 'Estoque',
      'alerts': 'Alertas',
      'performance': 'Performance',
      'reports': 'Relatórios',
      'integrations': 'Integrações',
      'workflows': 'Workflows',
      'standard': 'Padrão',
      
      // Industry vertical labels
      'fashion': 'Moda',
      'retail': 'Varejo',
      'manufacturing': 'Manufatura',
      'logistics': 'Logística',
      'generic': 'Genérico',
      
      // Client names
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

      {/* Tree View */}
      <TreeProvider
        defaultExpandedIds={expandedNodes}
        onNodeExpand={(nodeId, expanded) => {
          if (expanded) {
            setExpandedNodes(prev => [...prev, nodeId]);
          } else {
            setExpandedNodes(prev => prev.filter(id => id !== nodeId));
          }
        }}
        showLines={true}
        showIcons={true}
        selectable={false}
        className="border-0 bg-transparent shadow-none"
      >
        <Tree>
          {Object.entries(groupedModules).map(([primaryKey, secondaryGroups]) => {
            const PrimaryIcon = getGroupIcon(primaryKey, 'primary');
            const primaryCount = Object.values(secondaryGroups).flat().length;
            
            return (
              <TreeItem
                key={primaryKey}
                nodeId={primaryKey}
                label={getGroupLabel(primaryKey)}
                icon={<PrimaryIcon className="h-4 w-4" />}
                hasChildren={true}
                level={0}
              >
                {Object.entries(secondaryGroups).map(([secondaryKey, moduleList]) => {
                  const SecondaryIcon = getGroupIcon(secondaryKey, 'secondary');
                  
                  return (
                    <TreeItem
                      key={`${primaryKey}-${secondaryKey}`}
                      nodeId={`${primaryKey}-${secondaryKey}`}
                      label={
                        <div className="flex items-center gap-2 w-full">
                          <span>{getGroupLabel(secondaryKey)}</span>
                          <Badge variant="outline" size="sm">
                            {moduleList.length}
                          </Badge>
                        </div>
                      }
                      icon={<SecondaryIcon className="h-4 w-4" />}
                      hasChildren={true}
                      level={1}
                    >
                      {moduleList.map((module) => {
                        const TechnicalIcon = TECHNICAL_TYPE_ICONS[module.technical_type];
                        
                        return (
                          <TreeItem
                            key={module.id}
                            nodeId={module.id}
                            label={
                              <div className="flex items-center gap-2 w-full">
                                <span className="flex-1">{module.name}</span>
                                <Badge variant="outline" size="sm">
                                  {TechnicalIcon && <TechnicalIcon className="w-3 h-3 mr-1" />}
                                  {TECHNICAL_TYPE_LABELS[module.technical_type]}
                                </Badge>
                              </div>
                            }
                            icon={TechnicalIcon ? <TechnicalIcon className="h-4 w-4" /> : undefined}
                            hasChildren={false}
                            level={2}
                            data={module}
                            onClick={() => {
                              // Handle module click - could open details modal or navigate
                              console.log('Module clicked:', module);
                            }}
                          />
                        );
                      })}
                    </TreeItem>
                  );
                })}
              </TreeItem>
            );
          })}
        </Tree>
      </TreeProvider>

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