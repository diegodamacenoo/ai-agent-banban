'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { 
  Search, 
  Wifi, 
  WifiOff, 
  Clock, 
  Zap, 
  AlertTriangle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import type { TenantStatus } from '../../types/module-details';

interface TenantStatusTableProps {
  tenantStatus: TenantStatus[];
  moduleId: string;
  compact?: boolean;
}

export default function TenantStatusTable({ tenantStatus, moduleId, compact = false }: TenantStatusTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTenants = tenantStatus.filter(tenant =>
    tenant.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.tenant_slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onlineTenants = tenantStatus.filter(t => t.is_online).length;

  if (tenantStatus.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wifi className="w-5 h-5 mr-2" />
            Status dos Tenants
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            Nenhum tenant atribuído a este módulo
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wifi className="w-5 h-5 mr-2" />
          Status dos Tenants
          <Badge variant="outline" className="ml-auto">
            {onlineTenants}/{tenantStatus.length} online
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar tenant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-3">
            {filteredTenants.map((tenant) => (
              <div
                key={tenant.tenant_id}
                className={`p-3 rounded-lg border ${
                  tenant.is_online ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {tenant.is_online ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <h4 className="font-medium">{tenant.tenant_name}</h4>
                      <p className="text-sm text-gray-500">{tenant.implementation_name}</p>
                    </div>
                  </div>
                  
                  <div className="text-right text-sm">
                    <div className={`font-medium ${
                      tenant.response_time < 200 ? 'text-green-600' : 
                      tenant.response_time < 400 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {tenant.response_time}ms
                    </div>
                    <div className="text-gray-500">
                      {Math.floor((Date.now() - new Date(tenant.last_activity).getTime()) / 60000)}min atrás
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}