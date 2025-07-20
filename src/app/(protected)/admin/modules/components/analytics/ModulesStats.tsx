import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { 
  Package, 
  CheckCircle, 
  Clock, 
  Activity,
  AlertTriangle,
  Pause 
} from 'lucide-react';
import { getBaseModuleStats } from '@/app/actions/admin/modules/base-modules';

export async function ModulesStats() {
  const statsResponse = await getBaseModuleStats();
  const stats = statsResponse.data;

  const cards = [
    {
      title: 'Total de Módulos',
      value: stats.total,
      icon: Package,
      description: 'Módulos no sistema'
    },
    {
      title: 'Módulos Ativos',
      value: stats.active,
      icon: CheckCircle,
      description: 'Funcionando normalmente',
      color: 'text-green-600'
    },
    {
      title: 'Módulos Planejados',
      value: stats.planned,
      icon: Clock,
      description: 'Aguardando implementação',
      color: 'text-blue-600'
    },
    {
      title: 'Módulos Implementados',
      value: stats.implemented,
      icon: Activity,
      description: 'Prontos para ativação',
      color: 'text-yellow-600'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.color || 'text-muted-foreground'}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
} 