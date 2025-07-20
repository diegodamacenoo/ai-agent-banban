import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { ComponentSection } from '../DesignSystemSection';
import { Terminal, AlertCircle, Check } from 'lucide-react';

export function AlertsSection() {
  return (
    <ComponentSection 
      title="Alertas" 
      description="Exibe uma mensagem informativa ou de erro."
      className="flex flex-col w-fit"
    >
      <Alert variant="default">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Alerta Padrão</AlertTitle>
        <AlertDescription>
          Esta é uma notificação padrão. Pode ser usada para informações gerais.
        </AlertDescription>
      </Alert>
      
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Alerta Destrutivo</AlertTitle>
        <AlertDescription>
          Esta notificação indica um erro ou uma ação destrutiva.
        </AlertDescription>
      </Alert>
      
      <Alert variant="success">
        <Check className="h-4 w-4" />
        <AlertTitle>Alerta de Sucesso</AlertTitle>
        <AlertDescription>
          Esta notificação indica que uma ação foi completada com sucesso.
        </AlertDescription>
      </Alert>
      
      <Alert variant="warning">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Alerta de Atenção</AlertTitle>
        <AlertDescription>
          Esta notificação indica um estado de atenção.
        </AlertDescription>
      </Alert>
    </ComponentSection>
  );
}