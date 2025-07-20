import { Button } from '@/shared/ui/button';
import { ComponentSection } from '../DesignSystemSection';
import { Mail, ArrowRight, Plus, Loader2 } from 'lucide-react';

export function ButtonsSection() {
  return (
    <ComponentSection title="Botões">
      <h3 className="font-medium">Variantes</h3>
      <div className="flex flex-wrap items-center gap-4">
        <Button>Padrão</Button>
        <Button variant="secondary">Secundário</Button>
        <Button variant="destructive">Destrutivo</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Link</Button>
      </div>
      
      <h3 className="font-medium">Tamanhos</h3>
      <div className="flex flex-wrap items-center gap-4">
        <Button size="sm">Pequeno</Button>
        <Button size="default">Padrão</Button>
        <Button size="lg">Grande</Button>
      </div>
      
      <h3 className="font-medium">Com Ícones</h3>
      <div className="flex flex-wrap items-center gap-4">
        <Button leftIcon={<Mail className="h-5 w-5" />}>
          Login com Email
        </Button>
        <Button variant="outline" size="icon">
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button leftIcon={<Plus className="h-5 w-5" />} size="lg">
          Adicionar
        </Button>
      </div>
      
      <h3 className="font-medium">Estados</h3>
      <div className="flex flex-wrap items-center gap-4">
        <Button disabled>Desabilitado</Button>
        <Button disabled leftIcon={<Loader2 className="h-4 w-4 animate-spin" />}>
          Carregando
        </Button>
      </div>
    </ComponentSection>
  );
}