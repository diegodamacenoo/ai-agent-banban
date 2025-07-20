import { Badge } from '@/shared/ui/badge';
import { ComponentSection } from '../DesignSystemSection';
import { CheckCircle, AlertCircle, Settings } from 'lucide-react';

export function BadgesSection() {
  return (
    <ComponentSection title="Badges">
      <h3 className="font-medium">Variantes de Estilo</h3>
      <div className="flex flex-wrap items-center gap-4">
        <Badge>Padrão</Badge>
        <Badge variant="muted">Muted</Badge>
        <Badge variant="success">Sucesso</Badge>
        <Badge variant="warning">Aviso</Badge>
        <Badge variant="destructive">Destrutivo</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="ghost">Ghost</Badge>
      </div>
      
      <h3 className="font-medium">Tamanhos</h3>
      <div className="flex flex-wrap items-center gap-4">
        <Badge size="sm">Pequeno</Badge>
        <Badge size="default">Padrão</Badge>
        <Badge size="lg">Grande</Badge>
      </div>
      
      <h3 className="font-medium">Com Ícones</h3>
      <div className="flex flex-wrap items-center gap-4">
        <Badge variant="success" size="lg" icon={CheckCircle}>
          Verificado
        </Badge>
        <Badge variant="warning" icon={AlertCircle} iconPosition="right">
          Atenção
        </Badge>
        <Badge variant="outline" size="icon" icon={Settings} />
      </div>
    </ComponentSection>
  );
}