import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import {
  Package,
  CheckCircle,
  TestTube,
  AlertTriangle,
  BarChart3,
  Zap,
  Star
} from 'lucide-react';
import { ExecutiveStats } from '../../hooks/useModuleStats';

interface ExecutiveDashboardProps {
  stats: ExecutiveStats;
}

export function ExecutiveDashboard({ stats }: ExecutiveDashboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Dashboard Executivo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-blue-600 flex items-center justify-center gap-2">
              <Package className="h-6 w-6" />
              {stats.total}
            </div>
            <div className="text-sm font-medium">Módulos</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6" />
              {stats.produção}
            </div>
            <div className="text-sm font-medium">Produção</div>
            <div className="text-xs text-muted-foreground">{stats.prodPercentage}%</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 flex items-center justify-center gap-2">
              <TestTube className="h-6 w-6" />
              {stats.beta}
            </div>
            <div className="text-sm font-medium">Beta</div>
            <div className="text-xs text-muted-foreground">{stats.betaPercentage}%</div>
          </div>
          <div className="text-center p-4 border rounded-lg">
            <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              {stats.problemas}
            </div>
            <div className="text-sm font-medium">Problemas</div>
            <div className="text-xs text-muted-foreground">{stats.problemsPercentage}%</div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center flex items-center justify-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span className="font-medium">{stats.avgAdoption}%</span> adoção média
          </div>
          <div className="text-center flex items-center justify-center gap-1">
            <Zap className="h-4 w-4" />
            <span className="font-medium">2.1s</span> tempo médio
          </div>
          <div className="text-center flex items-center justify-center gap-1">
            <Star className="h-4 w-4" />
            <span className="font-medium">4.6★</span> satisfação
          </div>
        </div>
      </CardContent>
    </Card>
  );
}