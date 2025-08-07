'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Textarea } from '@/shared/ui/textarea';
import { useToast } from '@/shared/ui/toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { Loader2, Edit, Info } from 'lucide-react';
import { updateModuleImplementation } from '@/app/actions/admin/modules/module-implementations';
import { UpdateModuleImplementationSchema, ModuleImplementation } from '@/app/actions/admin/modules/schemas';

// Schema para o formulário, omitindo o ID que não é editável no form
const EditImplementationFormSchema = UpdateModuleImplementationSchema.omit({ id: true });
type EditImplementationFormValues = z.infer<typeof EditImplementationFormSchema>;

interface EditImplementationDialogProps {
  implementation: ModuleImplementation;
  onSuccess: () => void;
  trigger?: React.ReactNode;
  onOptimisticUpdate?: (updatedImplementation: ModuleImplementation) => string;
  onServerSuccess?: (operationId: string, serverData?: ModuleImplementation) => void;
  onServerError?: (operationId: string, errorMessage: string) => void;
}

export function EditImplementationDialog({implementation,
  onSuccess,
  trigger,
  onOptimisticUpdate,
  onServerSuccess,
  onServerError,
}: EditImplementationDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const form = useForm<EditImplementationFormValues>({
    resolver: zodResolver(EditImplementationFormSchema),
    defaultValues: {
      name: implementation.name || '',
      implementation_key: implementation.implementation_key || '',
      description: implementation.description || '',
      audience: implementation.audience,
      complexity: implementation.complexity,
      is_default: implementation.is_default,
      component_path: implementation.component_path || '',
      // Adicione outros campos conforme necessário
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        name: implementation.name || '',
        implementation_key: implementation.implementation_key || '',
        description: implementation.description || '',
        audience: implementation.audience,
        complexity: implementation.complexity,
        is_default: implementation.is_default,
        component_path: implementation.component_path || '',
      });
    }
  }, [isOpen, implementation, form]);

  const onSubmit = (values: EditImplementationFormValues) => {
    startTransition(async () => {
      let operationId: string | undefined;
      
      // Update otimístico IMEDIATO
      if (onOptimisticUpdate) {
        const updatedImplementation: ModuleImplementation = {
          ...implementation,
          ...values,
        };
        operationId = onOptimisticUpdate(updatedImplementation);
        console.log('🚀 Update otimístico aplicado:', operationId);
        
        // Fechar diálogo imediatamente para UX rápida
        setIsOpen(false);
        toast.success('Implementação atualizada!');
        onSuccess();
      }

      try {
        // Server action em background
        const result = await updateModuleImplementation({
          id: implementation.id,
          ...values,
        });

        if (result.success) {
          // Confirmar operação otimística
          if (operationId && onServerSuccess) {
            onServerSuccess(operationId, result.data);
            console.log('✅ Operação confirmada pelo servidor:', operationId);
          }
          
          // Se não usou otimístico, fazer callback tradicional
          if (!onOptimisticUpdate) {
            toast.success('Implementação atualizada com sucesso!');
            onSuccess();
            setIsOpen(false);
          }
        } else {
          // Reverter operação otimística
          if (operationId && onServerError) {
            onServerError(operationId, result.error || 'Erro no servidor');
            console.log('❌ Operação revertida:', operationId);
          } else {
            toast.error(result.error || 'Falha ao atualizar a implementação.');
          }
        }
      } catch (error) {
        // Reverter operação otimística em caso de erro
        if (operationId && onServerError) {
          onServerError(operationId, 'Erro de conexão');
          console.log('❌ Operação revertida por erro:', operationId);
        } else {
          toast.error('Erro ao conectar com o servidor.');
        }
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" leftIcon={<Edit className="w-4 h-4" />}>
            Editar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Implementação</DialogTitle>
          <DialogDescription>
            Atualize os detalhes da implementação "{implementation.name}".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Implementação</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Dashboard Padrão" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="implementation_key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chave da Implementação</FormLabel>
                    <FormControl>
                      <Input placeholder="ex: standard-dashboard" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o propósito desta implementação."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="component_path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Caminho do Componente
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-sm">
                            <strong>Define como localizar o componente React</strong> desta implementação.
                            <br /><br />
                            <strong>Opções de Configuração:</strong>
                            <br /><br />
                            <strong>1. Nome do Componente (Recomendado):</strong>
                            <br />
                            • Digite apenas: <code>BanbanAlertsImplementation</code>
                            <br />
                            • Sistema usa mapeamento automático
                            <br />
                            • Mais confiável e mantível
                            <br /><br />
                            <strong>2. Path Relativo:</strong>
                            <br />
                            • Ex: <code>./alerts/implementations/BanbanAlerts</code>
                            <br />
                            • Relativo ao contexto atual
                            <br /><br />
                            <strong>3. Path Absoluto:</strong>
                            <br />
                            • Ex: <code>@/app/(protected)/[slug]/(modules)/alerts/implementations/BanbanAlerts</code>
                            <br /><br />
                            <strong>Auto-resolução:</strong> Se vazio, sistema tenta resolver automaticamente baseado no slug + implementation_key.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: BanbanAlertsImplementation ou ./alerts/implementations/BanbanAlerts" {...field} />
                  </FormControl>
                  <FormDescription>
                    <strong>Recomendado:</strong> Use apenas o nome do componente (ex: BanbanAlertsImplementation) para aproveitar o mapeamento automático do sistema.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Público-Alvo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o público" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="generic">Genérico</SelectItem>
                        <SelectItem value="client-specific">Cliente Específico</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="complexity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disponibilidade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o plano" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="basic">Plano Básico</SelectItem>
                        <SelectItem value="standard">Plano Padrão</SelectItem>
                        <SelectItem value="advanced">Plano Avançado</SelectItem>
                        <SelectItem value="enterprise">Plano Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Implementação Padrão</FormLabel>
                    <FormDescription>
                      Marcar esta como a implementação padrão para o módulo base.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
