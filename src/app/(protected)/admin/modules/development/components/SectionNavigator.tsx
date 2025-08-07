'use client';

import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Progress } from '@/shared/ui/progress';
import { CheckCircle2, Circle, AlertTriangle, Clock, ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Section } from '../types';

interface SectionNavigatorProps {
  sections: Section[];
  currentSection: string;
  onSectionChange: (sectionId: string) => void;
  overallProgress: number;
  className?: string;
}

export function SectionNavigator({
  sections,
  currentSection,
  onSectionChange,
  overallProgress,
  className
}: SectionNavigatorProps) {

  const getStatusIcon = (status: Section['status']) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'in-progress': return <Clock className="h-5 w-5 text-blue-500 animate-spin-slow" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      default: return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  return (
    <Card className={cn('sticky top-4', className)} size="sm" variant="rounded">
      <CardContent>
        {/* Overall Progress */}
        <div className="mb-4 px-2">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-sm font-semibold">Progresso Geral</h3>
            <span className="text-sm font-bold text-blue-600">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {sections.map((section) => {
            const isActive = section.id === currentSection;
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  'w-full text-left flex items-center gap-3 p-2 rounded-md transition-all duration-200',
                  isActive 
                    ? 'bg-blue-50 text-blue-700 shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <div className={cn(
                  'p-1.5 rounded-md',
                  isActive ? 'bg-blue-100' : 'bg-gray-100'
                )}>
                  <Icon className={cn('h-5 w-5', isActive ? 'text-blue-600' : 'text-gray-500')} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{section.name}</p>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
                {getStatusIcon(section.status)}
              </button>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
}