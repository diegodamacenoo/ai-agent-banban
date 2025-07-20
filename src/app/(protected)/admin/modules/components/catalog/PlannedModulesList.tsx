import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { 
  Clock, 
  Settings,
  CheckCircle,
  MoreHorizontal,
  AlertTriangle
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
  type PlannedModule
} from '@/shared/types/module-system';

export async function PlannedModulesList() {
  const response = await getAvailableModules();
  
  if (!response.success) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Erro ao carregar módulos planejados: {response.error}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { planned } = response.data;

  if (planned.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum módulo planejado</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Comece planejando novos módulos para suas organizações
            </p>
            <Button asChild>
              <Link href="/admin/modules/plan">
                Planejar Módulo
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Alta';
      case 'medium':
        return 'Média';
      case 'low':
        return 'Baixa';
      default:
        return priority;
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {planned.map((module: PlannedModule) => (
        <Card key={module.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <CardTitle className="text-base">{module.name}</CardTitle>
                </div>
                <Badge variant="outline">
                  {MODULE_TYPE_LABELS[module.type] || module.type}
                </Badge>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/admin/modules/planned/${module.id}`}>
                      <Settings className="h-4 w-4 mr-2" />
                      Editar
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem icon={CheckCircle}>
                    Marcar como Implementado
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {module.implementationNotes || 'Sem notas de implementação'}
              </p>
              
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-muted-foreground">Prioridade:</span>
                  <Badge 
                    variant="secondary" 
                    className={getPriorityColor(module.priority)}
                  >
                    {getPriorityLabel(module.priority)}
                  </Badge>
                </div>
                {module.estimatedHours && (
                  <div className="flex items-center space-x-1 text-muted-foreground">
                    <span>Estimativa:</span>
                    <span className="font-medium">{module.estimatedHours}h</span>
                  </div>
                )}
              </div>

              {module.expectedFeatures && module.expectedFeatures.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Features Esperadas:</p>
                  <div className="flex flex-wrap gap-1">
                    {module.expectedFeatures.slice(0, 3).map((feature: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                    {module.expectedFeatures.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{module.expectedFeatures.length - 3} mais
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {module.requiredSkills && module.requiredSkills.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Skills Necessárias:</p>
                  <div className="flex flex-wrap gap-1">
                    {module.requiredSkills.slice(0, 2).map((skill: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {module.requiredSkills.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{module.requiredSkills.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t">
                <Button size="sm" className="w-full" asChild>
                  <Link href={`/admin/modules/planned/${module.id}`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 