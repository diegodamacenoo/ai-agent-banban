import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  Activity,
  Settings,
  Play,
  Pause,
  MoreHorizontal
} from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { getBaseModules } from '@/app/actions/admin/modules';
import { 
  MODULE_TYPE_LABELS,
  type ModuleInfo,
  type PlannedModule
} from '@/shared/types/module-system';
import { MODULE_STATUS_LABELS, MODULE_STATUS_COLORS } from '@/shared/constants/module-labels';
import router from 'next/router';

interface ModulesListProps {
  filter: 'all' | 'implemented' | 'planned' | 'active';
}

export async function ModulesList({ filter }: ModulesListProps) {
  const response = await getAvailableModules();
  
  if (!response.success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Erro ao carregar módulos: {response.error}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { discovered, planned } = response.data;
  let modules: (ModuleInfo | PlannedModule)[] = [];

  switch (filter) {
    case 'all':
      modules = [...discovered, ...planned];
      break;
    case 'implemented':
      modules = discovered.filter((m: ModuleInfo) => m.status === 'IMPLEMENTED');
      break;
    case 'planned':
      modules = planned;
      break;
    case 'active':
      modules = discovered.filter((m: ModuleInfo) => m.status === 'ACTIVE');
      break;
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'IMPLEMENTED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'PLANNED':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'ACTIVE':
        return <Activity className="h-4 w-4 text-green-600" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status?: string) => {
    // As novas cores já são classes CSS completas
    const colorClass = MODULE_STATUS_COLORS[status as keyof typeof MODULE_STATUS_COLORS];
    if (colorClass) {
      return colorClass;
    }
    return 'bg-gray-100 text-gray-800';
  };

  if (modules.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {filter === 'all' && 'Nenhum módulo encontrado'}
              {filter === 'implemented' && 'Nenhum módulo implementado'}
              {filter === 'planned' && 'Nenhum módulo planejado'}
              {filter === 'active' && 'Nenhum módulo ativo'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {filter === 'all' && 'Comece escaneando módulos ou planejando novos módulos'}
              {filter === 'implemented' && 'Nenhum módulo foi implementado ainda'}
              {filter === 'planned' && 'Nenhum módulo foi planejado ainda'}
              {filter === 'active' && 'Nenhum módulo está ativo no momento'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {modules.map((module) => {
        const isPlanned = !('status' in module);
        const status = isPlanned ? 'planned' : module.status;
        
        return (
          <Card key={module.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <CardTitle className="text-lg">{module.name}</CardTitle>
                    <Badge variant="outline">
                      {MODULE_TYPE_LABELS[module.type] || module.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {'description' in module ? module.description : 
                     'implementationNotes' in module ? module.implementationNotes : 
                     'Sem descrição'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge 
                    variant="outline"
                    className={getStatusColor(status)}
                  >
                    {MODULE_STATUS_LABELS[status as keyof typeof MODULE_STATUS_LABELS] || 'Desconhecido'}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild icon={Settings} onClick={() => router.push(`/admin/modules/${module.id}/configure`)}>
                        Configurar
                      </DropdownMenuItem>
                      {!isPlanned && status === 'IMPLEMENTED' && (
                        <DropdownMenuItem icon={Play}>
                          Ativar
                        </DropdownMenuItem>
                      )}
                      {!isPlanned && status === 'ACTIVE' && (
                        <DropdownMenuItem icon={Pause}>
                          Desativar
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <span>Tipo:</span>
                  <span className="font-medium">
                    {MODULE_TYPE_LABELS[module.type] || module.type}
                  </span>
                </div>
                {!isPlanned && 'version' in module && (
                  <div className="flex items-center space-x-1">
                    <span>Versão:</span>
                    <span className="font-medium">{module.version}</span>
                  </div>
                )}
                {'priority' in module && (
                  <div className="flex items-center space-x-1">
                    <span>Prioridade:</span>
                    <span className="font-medium capitalize">{module.priority}</span>
                  </div>
                )}
                {'estimatedHours' in module && (
                  <div className="flex items-center space-x-1">
                    <span>Estimativa:</span>
                    <span className="font-medium">{module.estimatedHours}h</span>
                  </div>
                )}
              </div>
              
              {(module.features && Array.isArray(module.features) && module.features.length > 0) && (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground mb-2">Features:</p>
                  <div className="flex flex-wrap gap-1">
                    {module.features.map((feature: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 