'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/shared/ui/dropdown-menu';
import { 
  ChevronDown, 
  ChevronUp, 
  Download, 
  FileText, 
  Sheet,
  Loader2
} from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  exportable?: boolean;
  collapsible?: boolean;
  onExport?: (format: 'pdf' | 'csv') => void;
  onToggle?: (collapsed: boolean) => void;
  defaultCollapsed?: boolean;
}

export function SectionHeader({
  title,
  subtitle,
  exportable = false,
  collapsible = false,
  onExport,
  onToggle,
  defaultCollapsed = false
}: SectionHeaderProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [exporting, setExporting] = useState<'pdf' | 'csv' | null>(null);

  const handleToggle = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    onToggle?.(newCollapsed);
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (!onExport) return;
    
    setExporting(format);
    try {
      await onExport(format);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        {collapsible && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            className="p-1 h-8 w-8"
          >
            {collapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        )}
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
      </div>

      {exportable && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={!!exporting}>
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem 
              onClick={() => handleExport('pdf')}
              disabled={exporting === 'pdf'}
            >
              <FileText className="h-4 w-4 mr-2" />
              Exportar PDF
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleExport('csv')}
              disabled={exporting === 'csv'}
              icon={Sheet}
            >
              Exportar CSV
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

interface PerformanceSectionProps {
  id: string;
  title: string;
  subtitle?: string;
  exportable?: boolean;
  collapsible?: boolean;
  children: React.ReactNode;
  onExport?: (format: 'pdf' | 'csv') => void;
  defaultCollapsed?: boolean;
  className?: string;
}

export function PerformanceSection({
  id,
  title,
  subtitle,
  exportable = false,
  collapsible = false,
  children,
  onExport,
  defaultCollapsed = false,
  className = ""
}: PerformanceSectionProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const handleExport = (format: 'pdf' | 'csv') => {
    console.debug(`Exporting ${id} as ${format}`);
    // Simular delay de export
    return new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className={`space-y-4 ${className}`} id={id}>
      <SectionHeader
        title={title}
        subtitle={subtitle}
        exportable={exportable}
        collapsible={collapsible}
        onExport={onExport || handleExport}
        onToggle={setCollapsed}
        defaultCollapsed={defaultCollapsed}
      />
      
      {!collapsed && (
        <Card className="p-6">
          {children}
        </Card>
      )}
    </div>
  );
}