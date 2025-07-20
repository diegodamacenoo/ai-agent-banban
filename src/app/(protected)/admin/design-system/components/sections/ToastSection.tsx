import { Button } from '@/shared/ui/button';
import { useToast } from '@/shared/ui/toast';
import { ComponentSection } from '../DesignSystemSection';

export function ToastSection() {
  const { toast } = useToast();

  return (
    <ComponentSection 
      title="Toast" 
      description="Notificações temporárias com botões de ação personalizados que seguem o design system."
      className="space-y-6"
    >
      <div>
        <h3 className="font-medium mb-3">Toast Básicos</h3>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            onClick={() => toast.info("Informação", { description: "Esta é uma mensagem informativa." })}
          >
            Info
          </Button>
          <Button
            variant="success"
            onClick={() => toast.success("Sucesso!", { description: "Operação realizada com sucesso." })}
          >
            Sucesso
          </Button>
          <Button
            variant="warning"
            onClick={() => toast.warning("Atenção", { description: "Verifique os dados antes de continuar." })}
          >
            Aviso
          </Button>
          <Button
            variant="destructive"
            onClick={() => toast.error("Erro!", { description: "Ocorreu um problema inesperado." })}
          >
            Erro
          </Button>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">Toast com Botões de Ação</h3>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            onClick={() => {
              toast.show({
                title: "Agendado: Evento",
                description: "Sexta-feira, 23 de Fevereiro às 17h",
                action: {
                  label: "Desfazer",
                  onClick: () => console.debug("Desfazer ação"),
                },
              });
            }}
          >
            Com Ação
          </Button>
          
          <Button
            variant="success"
            onClick={() => 
              toast.success("Item removido", {
                description: "O item foi removido da lista.",
                action: {
                  label: "Desfazer",
                  onClick: () => console.debug("Item restaurado")
                }
              })
            }
          >
            Sucesso + Desfazer
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              toast.show({
                title: "Confirmar operação",
                description: "Esta ação não pode ser desfeita.",
                action: {
                  label: "Confirmar",
                  onClick: () => console.debug("Confirmado")
                },
                cancel: {
                  label: "Cancelar",
                  onClick: () => console.debug("Cancelado")
                }
              })
            }
          >
            Confirmar/Cancelar
          </Button>
        </div>
      </div>

      <div>
        <h3 className="font-medium mb-3">Toast Personalizado</h3>
        <div className="flex flex-wrap gap-4">
          <Button
            variant="outline"
            onClick={() => 
              toast.show({
                title: "Arquivo salvo",
                description: "Deseja abrir o arquivo agora?",
                action: { 
                  label: "Abrir", 
                  onClick: () => console.debug("Abrindo arquivo") 
                },
                cancel: { 
                  label: "Mais tarde", 
                  onClick: () => console.debug("Adiado") 
                }
              })
            }
          >
            Personalizado
          </Button>

          <Button
            variant="destructive"
            onClick={() => {
              toast.error("Erro crítico!", {
                description: "Falha na conexão com o servidor.",
                action: {
                  label: "Tentar Novamente",
                  onClick: () => console.debug("Tentando novamente..."),
                },
              });
            }}
          >
            Erro + Retry
          </Button>
        </div>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>Nota:</strong> Os botões do toast agora seguem exatamente o mesmo design system 
          dos componentes Button, incluindo cores, espaçamento e suporte a ícones.
        </p>
      </div>
    </ComponentSection>
  );
}