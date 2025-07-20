import Link from 'next/link';
import { TableCell, TableRow } from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { Info, Archive } from 'lucide-react';
import { CoreModule } from '@/shared/types/module-catalog';
import { OrphanModule } from '@/shared/types/module-system';
import { ModuleAdoptionData } from '../../../hooks/useModuleData';
import { ModuleActionsMenu } from '../menus/ModuleActionsMenu';
import { cn } from "@/lib/utils";
import {
  CATEGORY_ICONS,
  STATUS_ICONS,
  TABLE_CONFIG,
  TECHNICAL_TYPE_LABELS,
  TECHNICAL_TYPE_ICONS
} from '../../../constants/moduleConstants';
import {
  isModuleOrphan,
  calculateModuleHealth,
  calculateModuleAdoption,
  calculateModulePerformance,
  calculateModuleAvailability,
  calculateModuleAlerts,
  getStatusLabel,
  getStatusIconColor
} from '../../../utils/moduleHelpers';

interface ModuleTableRowProps {
  module: CoreModule;
  adoptionData: Record<string, ModuleAdoptionData>;
  orphanModules: OrphanModule[];
  onArchive: (moduleId: string) => Promise<void>;
  onUnarchive: (moduleId: string) => Promise<void>;
  onMaturityChange: (moduleId: string, newMaturity: any) => Promise<void>;
  onDelete?: (moduleId: string) => Promise<void>;
  isGrouped?: boolean;
}

export function ModuleTableRow({
  module,
  adoptionData,
  orphanModules,
  onArchive,
  onUnarchive,
  onMaturityChange,
  onDelete,
  isGrouped = false
}: ModuleTableRowProps) {
  const orphanData = isModuleOrphan(module.id, orphanModules);
  const health = calculateModuleHealth(module, orphanModules);
  const adoption = calculateModuleAdoption(module.id, adoptionData);
  const performance = calculateModulePerformance(module, orphanModules);
  const availability = calculateModuleAvailability(module, orphanModules);
  const alerts = calculateModuleAlerts(module, orphanModules);

  return (
    <TableRow className={cn(module.is_archived && "opacity-50")}>
      {/* ==================== COLUNA 1: MÓDULO ==================== */}
      <TableCell className={cn("font-medium", TABLE_CONFIG.COLUMNS.MODULE)}>
        <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
             
            {/* Icon based on category */}
            {(() => {
              const category = module.category || 'standard';
              const CategoryIcon = CATEGORY_ICONS[category] || CATEGORY_ICONS.standard;
              return <CategoryIcon className="w-4 h-4 text-blue-600" />;
            })()}
            
            <div className={cn(
              "font-medium flex items-center gap-1",
              module.is_archived && "text-muted-foreground"
            )}>
              <Link 
                href={`/admin/modules/${module.id}`}
                className="hover:underline"
              >
                {module.name}
              </Link>
              
              {/* Badge de Tipo Técnico */}
              {module.technical_type && (
                <Badge variant="outline" size="sm">
                  {(() => {
                    const TechnicalIcon = TECHNICAL_TYPE_ICONS[module.technical_type];
                    return TechnicalIcon ? <TechnicalIcon className="w-3 h-3" /> : null;
                  })()}
                  {TECHNICAL_TYPE_LABELS[module.technical_type]}
                </Badge>
              )}
              
              {/* Tooltip de Informações */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="text-sm font-medium">{module.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {module.description}
                    </p>
                    {module.is_archived && (
                      <p className="text-xs text-amber-600 mt-1 font-medium">
                        ⚠️ Módulo core arquivado - não disponível para novos tenants
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Badge de Arquivado */}
              {module.is_archived && (
                <Badge variant="light_warning" size="sm" className="ml-1">
                  <Archive className="w-3 h-3 mr-1" />
                  Arquivado
                </Badge>
              )}
            </div>
          </div>
        </div>
      </TableCell>

      {/* ==================== COLUNA 2: STATUS ==================== */}
      <TableCell className={TABLE_CONFIG.COLUMNS.STATUS}>
        <div className="flex items-center gap-1">
          {(() => {
            const StatusIcon = STATUS_ICONS[module.maturity_status as keyof typeof STATUS_ICONS] || STATUS_ICONS.PLANNED;
            const statusLabel = getStatusLabel(module.maturity_status);
            const iconColor = getStatusIconColor(module.maturity_status);
            
            return (
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <StatusIcon className={`h-3 w-3 ${iconColor}`} />
                {statusLabel}
              </Badge>
            );
          })()}
        </div>
      </TableCell>

      {/* ==================== COLUNA 3: SAÚDE ==================== */}
      <TableCell className={TABLE_CONFIG.COLUMNS.HEALTH}>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <health.icon className={`h-3 w-3 ${health.color}`} />
                  <span className="text-xs font-medium">{health.percentage}%</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm font-medium">{health.label} - {health.percentage}%</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {health.description}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>

      {/* ==================== COLUNA 4: ADOÇÃO ==================== */}
      <TableCell className={TABLE_CONFIG.COLUMNS.ADOPTION}>
        <div className="flex items-center gap-1">
          {adoption.hasData ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <adoption.icon className={`h-3 w-3 ${adoption.color}`} />
                    <span className="text-xs font-medium">{adoption.percentage}%</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm font-medium">
                    {adoption.percentage}% - {adoption.activeOrganizations} organizações ativas de {adoption.totalOrganizations} total
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {adoption.description}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex items-center gap-1">
              <adoption.icon className={`h-3 w-3 ${adoption.color}`} />
              <span className="text-xs font-medium">-</span>
            </div>
          )}
        </div>
      </TableCell>

      {/* ==================== COLUNA 5: PERFORMANCE ==================== */}
      <TableCell className={TABLE_CONFIG.COLUMNS.PERFORMANCE}>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 cursor-help">
                  <performance.icon className={`h-3 w-3 ${performance.color}`} />
                  <span className="text-xs font-medium">{performance.status}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm font-medium">{performance.status}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {performance.description}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>

      {/* ==================== COLUNA 6: DISPONÍVEL ==================== */}
      <TableCell className={TABLE_CONFIG.COLUMNS.AVAILABILITY}>
        <div className="flex items-center gap-1">
          <availability.icon className={`h-3 w-3 ${availability.color}`} />
          <span className="text-xs">{availability.status}</span>
        </div>
      </TableCell>

      {/* ==================== COLUNA 7: ALERTAS ==================== */}
      <TableCell className={TABLE_CONFIG.COLUMNS.ALERTS}>
        <div className="flex items-center gap-1">
          {alerts.type !== 'none' ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 cursor-help">
                    <alerts.icon className={`h-3 w-3 ${alerts.color}`} />
                    <span className="text-xs font-medium">{alerts.label}</span>
                    {alerts.sublabel && (
                      <span className="text-xs text-muted-foreground">{alerts.sublabel}</span>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <p className="text-sm font-medium">{alerts.title}</p>
                  {alerts.details.length > 0 && (
                    <ul className="text-xs text-muted-foreground mt-1">
                      {alerts.details.map((detail, index) => (
                        <li key={index}>{detail}</li>
                      ))}
                    </ul>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <div className="flex items-center gap-1">
              <alerts.icon className={`h-3 w-3 ${alerts.color}`} />
              <span className="text-xs text-muted-foreground">{alerts.label}</span>
            </div>
          )}
        </div>
      </TableCell>

      {/* ==================== COLUNA 8: MENU DE AÇÕES ==================== */}
      <TableCell className={cn("text-right", TABLE_CONFIG.COLUMNS.ACTIONS)}>
        <ModuleActionsMenu
          module={module}
          isOrphan={!!orphanData}
          onArchive={onArchive}
          onUnarchive={onUnarchive}
          onMaturityChange={onMaturityChange}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}