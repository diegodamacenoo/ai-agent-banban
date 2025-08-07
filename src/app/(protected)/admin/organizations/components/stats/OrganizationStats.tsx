import { AnalyticsCard, AnalyticsGrid } from '@/shared/components/Layout';
import { Building2, Check, Brush, BadgeCheck } from 'lucide-react';
import type { OrganizationStats } from '../../types';

interface OrganizationStatsProps {
  stats: OrganizationStats;
}

/**
 * Componente de estatísticas das organizações
 * Mostra cards com métricas principais do sistema
 */
export const OrganizationStatsComponent = ({ stats }: OrganizationStatsProps) => {
  return (
    <AnalyticsGrid>
      <AnalyticsCard
        title="Total de Organizações"
        description="organizações cadastradas"
        value={stats.total}
        icon={<Building2 className="h-4 w-4 text-zinc-600" />}
        iconBgColor="bg-zinc-100"
      />
      <AnalyticsCard
        title="Implementadas"
        description="implementação completa"
        value={stats.active}
        icon={<Check className="h-5 w-5 text-emerald-600" />}
        iconBgColor="bg-emerald-100"
        textColor="text-emerald-600"
      />
      <AnalyticsCard
        title="Custom"
        description="implementações customizadas"
        value={stats.custom}
        icon={<Brush className="h-5 w-5 text-blue-600" />}
        iconBgColor="bg-blue-50"
        textColor="text-blue-600"
      />
      <AnalyticsCard
        title="Standard"
        description="implementações padrão"
        value={stats.standard}
        icon={<BadgeCheck className="h-5 w-5 text-zinc-600" />}
        iconBgColor="bg-zinc-50"
        textColor="text-zinc-600"
      />
    </AnalyticsGrid>
  );
};