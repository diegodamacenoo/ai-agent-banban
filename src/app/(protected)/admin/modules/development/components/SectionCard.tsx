'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'warning' | 'error';
  progress?: {
    current: number;
    total: number;
  };
  children: React.ReactNode;
}

export function SectionCard({
  id,
  title,
  description,
  status,
  progress,
  children,
}: SectionCardProps) {

  const getStatusConfig = (status: SectionCardProps['status']) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle2, color: 'text-green-600', badge: { variant: 'default' as const, text: 'Concluído' }, progressColor: 'bg-green-500' };
      case 'in-progress':
        return { icon: Clock, color: 'text-blue-600', badge: { variant: 'secondary' as const, text: 'Em Andamento' }, progressColor: 'bg-blue-500' };
      case 'warning':
        return { icon: AlertTriangle, color: 'text-yellow-600', badge: { variant: 'outline' as const, text: 'Atenção' }, progressColor: 'bg-yellow-500' };
      case 'error':
        return { icon: AlertTriangle, color: 'text-red-600', badge: { variant: 'destructive' as const, text: 'Erro' }, progressColor: 'bg-red-500' };
      default:
        return { icon: Clock, color: 'text-gray-600', badge: { variant: 'outline' as const, text: 'Pendente' }, progressColor: 'bg-gray-400' };
    }
  };

  const config = getStatusConfig(status);
  const StatusIcon = config.icon;
  const progressPercentage = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <Card id={id} size="sm" variant="rounded">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <StatusIcon className={cn('h-6 w-6', config.color)} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">{title}</CardTitle>
              <Badge variant={config.badge.variant} size="sm">{config.badge.text}</Badge>
            </div>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
        {progress && progress.total > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
              <span>Progresso da Seção</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <Progress value={progressPercentage} indicatorClassName={config.progressColor} />
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );
}