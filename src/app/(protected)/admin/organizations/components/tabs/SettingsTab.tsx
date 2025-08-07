import { TabsContent } from '@/shared/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Settings } from 'lucide-react';

import { SettingsSkeleton } from '../skeletons/OrganizationsPageSkeletons';

interface SettingsTabProps {
  activeTab: string;
  loading: boolean;
  isInitialLoad: boolean;
}

/**
 * Componente da aba de Configurações
 * Placeholder para configurações administrativas futuras
 */
export const SettingsTab = ({
  activeTab,
  loading,
  isInitialLoad,
}: SettingsTabProps) => {
  if (isInitialLoad && loading) {
    return (
      <TabsContent value="settings" activeValue={activeTab}>
        <SettingsSkeleton />
      </TabsContent>
    );
  }

  return (
    <TabsContent value="settings" activeValue={activeTab}>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Configurações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-zinc-500">
            <Settings className="h-12 w-12 mx-auto mb-2" />
            <p>Configurações em desenvolvimento</p>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};