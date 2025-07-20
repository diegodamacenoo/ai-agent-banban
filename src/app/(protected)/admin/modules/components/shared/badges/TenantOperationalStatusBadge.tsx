'use client';

import { Badge } from '@/shared/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import {
  TenantOperationalStatus,
  OPERATIONAL_STATUS_LABELS,
  OPERATIONAL_STATUS_DESCRIPTIONS,
  OPERATIONAL_STATUS_VARIANTS
} from '@/shared/types/tenant-operational-status';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Pause,
  Archive,
  AlertCircle,
  PlayCircle,
  Settings
} from 'lucide-react';

interface TenantOperationalStatusBadgeProps {
  status: TenantOperationalStatus;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Mapeamento de ícones para cada status
const STATUS_ICONS: Record<TenantOperationalStatus, React.ComponentType<{ className?: string }>> = {
  'REQUESTED': Clock,
  'PENDING_APPROVAL': Clock,
  'PROVISIONING': Loader2,
  'ENABLED': PlayCircle,
  'UPGRADING': Settings,
  'UP_TO_DATE': CheckCircle,
  'SUSPENDED': Pause,
  'DISABLED': XCircle,
  'ARCHIVED': Archive,
  'ERROR': AlertTriangle
};

// Configuração de animação por status
const STATUS_ANIMATIONS: Record<TenantOperationalStatus, string> = {
  'REQUESTED': '',
  'PENDING_APPROVAL': '',
  'PROVISIONING': 'animate-spin',
  'ENABLED': '',
  'UPGRADING': 'animate-pulse',
  'UP_TO_DATE': '',
  'SUSPENDED': '',
  'DISABLED': '',
  'ARCHIVED': '',
  'ERROR': 'animate-pulse'
};

export function TenantOperationalStatusBadge({
  status,
  showTooltip = true,
  size = 'md',
  className = ''
}: TenantOperationalStatusBadgeProps) {
  const label = OPERATIONAL_STATUS_LABELS[status];
  const description = OPERATIONAL_STATUS_DESCRIPTIONS[status];
  const variant = OPERATIONAL_STATUS_VARIANTS[status];
  const Icon = STATUS_ICONS[status];
  const animation = STATUS_ANIMATIONS[status];

  const sizeClasses = {
    sm: 'text-xs h-5',
    md: 'text-xs h-6',
    lg: 'text-sm h-7'
  };

  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };

  const badge = (
    <Badge
      variant={variant}
      className={`${sizeClasses[size]} flex items-center gap-1 ${className}`}
    >
      <Icon className={`${iconSizeClasses[size]} ${animation}`} />
      {label}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{label}</p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Componente adicional para mostrar histórico de status
interface StatusHistoryProps {
  history: Array<{
    status: TenantOperationalStatus;
    timestamp: string;
    reason?: string;
  }>;
  maxItems?: number;
}

export function StatusHistory({ history, maxItems = 5 }: StatusHistoryProps) {
  const recentHistory = history.slice(0, maxItems);

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">Histórico de Status</h4>
      <div className="space-y-1">
        {recentHistory.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <TenantOperationalStatusBadge 
                status={item.status} 
                size="sm" 
                showTooltip={false}
              />
              {item.reason && (
                <span className="text-muted-foreground">({item.reason})</span>
              )}
            </div>
            <span className="text-muted-foreground">
              {new Date(item.timestamp).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente para mostrar estatísticas de status
interface StatusStatsProps {
  stats: {
    total: number;
    byStatus: Record<TenantOperationalStatus, number>;
  };
}

export function StatusStats({ stats }: StatusStatsProps) {
  const statusEntries = Object.entries(stats.byStatus) as [TenantOperationalStatus, number][];
  const activeStatuses = statusEntries.filter(([_, count]) => count > 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
      {activeStatuses.map(([status, count]) => (
        <div key={status} className="flex flex-col items-center p-2 border rounded-lg">
          <TenantOperationalStatusBadge 
            status={status} 
            size="sm" 
            showTooltip={false}
          />
          <span className="text-lg font-bold mt-1">{count}</span>
        </div>
      ))}
    </div>
  );
} 