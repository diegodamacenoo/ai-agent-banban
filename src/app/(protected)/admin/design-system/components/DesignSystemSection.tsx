import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/shared/ui/card';
import { LucideIcon } from 'lucide-react';

interface DesignSystemSectionProps {
  id: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
}

export function DesignSystemSection({ 
  id, 
  title, 
  description, 
  icon: Icon, 
  children 
}: DesignSystemSectionProps) {
  return (
    <section id={id}>
      <div className="flex items-center gap-3 mb-6">
        {Icon && <Icon className="h-6 w-6 text-gray-700" />}
        <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
      </div>
      {description && (
        <p className="text-sm text-gray-600 mb-6">{description}</p>
      )}
      {children}
    </section>
  );
}

interface ComponentSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function ComponentSection({ 
  title, 
  description, 
  children, 
  className = "space-y-4" 
}: ComponentSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className={className}>
        {children}
      </CardContent>
    </Card>
  );
}