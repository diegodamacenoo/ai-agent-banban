import { TabsContent } from '@/shared/ui/tabs';
import { OverviewSkeleton } from '../skeletons/OrganizationsPageSkeletons';
import { OrganizationStatsComponent } from '../stats/OrganizationStats';
import { ApprovalsStatsWidget } from '../ApprovalsStatsWidget';
import { UrgentAlertsWidget } from '../UrgentAlertsWidget';
import { QuickActionsWidget } from '../QuickActionsWidget';
import type { OrganizationStats } from '../../types';

interface OverviewTabProps {
  activeTab: string;
  loading: boolean;
  isInitialLoad: boolean;
  organizationStats: OrganizationStats;
}

/**
 * Componente da aba Overview
 * Mostra estatísticas gerais e widgets informativos do sistema
 */
export const OverviewTab = ({
  activeTab,
  loading,
  isInitialLoad,
  organizationStats,
}: OverviewTabProps) => {
  return (
    <TabsContent value="overview" activeValue={activeTab}>
      {isInitialLoad && loading ? (
        <OverviewSkeleton />
      ) : (
        <div className="space-y-6">
          {/* Estatísticas principais do sistema */}
          <OrganizationStatsComponent stats={organizationStats} />

          {/* Widgets informativos e de ação rápida */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ApprovalsStatsWidget />
            <UrgentAlertsWidget />
            <QuickActionsWidget />
          </div>
        </div>
      )}
    </TabsContent>
  );
};