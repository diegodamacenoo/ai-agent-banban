import { TabsContent } from '@/shared/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { CheckCircle } from 'lucide-react';

import { ApprovalsSkeleton } from '../skeletons/OrganizationsPageSkeletons';
import { ApprovalsCard } from '../ApprovalsCard';

interface ApprovalsTabProps {
  activeTab: string;
  loading: boolean;
  isInitialLoad: boolean;
}

/**
 * Componente da aba de Aprovações
 * Central de aprovações e gestão de requests
 */
export const ApprovalsTab = ({
  activeTab,
  loading,
  isInitialLoad,
}: ApprovalsTabProps) => {
  if (isInitialLoad && loading) {
    return (
      <TabsContent value="approvals" activeValue={activeTab}>
        <ApprovalsSkeleton />
      </TabsContent>
    );
  }

  return (
    <TabsContent value="approvals" activeValue={activeTab}>
      <div className="space-y-4">
        {/* Widget de estatísticas de aprovações */}
        <ApprovalsCard />
        
        {/* Lista de aprovações pendentes */}
        <Card size="sm">
          <CardHeader>
            <CardTitle>Aprovações Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-zinc-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-2" />
              <p>Nenhuma aprovação pendente no momento</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
};