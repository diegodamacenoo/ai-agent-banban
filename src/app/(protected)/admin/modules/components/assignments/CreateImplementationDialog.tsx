'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/shared/ui/toast';
import { Loader2 } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Checkbox } from '@/shared/ui/checkbox'
import { Textarea } from '@/shared/ui/textarea'
import { createModuleImplementation } from '@/app/actions/admin/modules/module-implementations'
import { CreateModuleImplementationSchema, CreateModuleImplementationInput } from '@/app/actions/admin/modules/schemas'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/shared/ui/tooltip'
import { Info } from 'lucide-react'

interface BaseModule {
  id: string
  name: string
}

interface CreateImplementationDialogProps {
  baseModules: BaseModule[]
  initialModuleId?: string
  onImplementationCreated?: () => void
  onOptimisticCreate?: (newImplementation: any) => string
  onServerSuccess?: (operationId: string, serverData?: any) => void
  onServerError?: (operationId: string, errorMessage: string) => void
  children: React.ReactNode
}

export function CreateImplementationDialog({
  baseModules,
  initialModuleId,
  onImplementationCreated,
  onOptimisticCreate,
  onServerSuccess,
  onServerError,
  children,
}: CreateImplementationDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CreateModuleImplementationInput>({
    resolver: zodResolver(CreateModuleImplementationSchema),
    defaultValues: {
      base_module_id: initialModuleId || '',
      name: '',
      implementation_key: '',
      description: '',
      version: '1.0.0',
      component_type: 'file',
      component_path: '',
      audience: 'generic',
      complexity: 'standard',
      priority: 'medium',
      status: 'active',
      is_default: false,
      template_type: '',
      template_config: {},
      dependencies: [],
      config_schema_override: {},
    },
  })

  const onSubmit = async (values: CreateModuleImplementationInput) => {
    setIsSubmitting(true)
    let operationId: string | null = null

    const processedValues = {
      ...values,
      template_type: values.template_type === '' ? null : values.template_type,
    };

    try {
        // Se temos callbacks otimísticos, fazer update otimístico primeiro
        if (onOptimisticCreate) {
            // Criar implementação temporária para update otimístico
            const optimisticImplementation = {
                id: `temp-${Date.now()}`, // ID temporário
                ...processedValues,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                archived_at: null,
                deleted_at: null,
                created_by: 'temp-user-id'
            };

            // Aplicar update otimístico imediatamente
            operationId = onOptimisticCreate(optimisticImplementation);
            toast.info('Criando nova implementação...')
        } else {
            toast.info('Criando nova implementação...')
        }

        // Executar server action
        const result = await createModuleImplementation(processedValues)

        if (result.success) {
            // Sucesso - confirmar operação otimística se existe
            if (operationId && onServerSuccess) {
                onServerSuccess(operationId, result.data);
            }
            
            toast.success(result.message || 'Implementação criada com sucesso!')
            onImplementationCreated?.()
            setIsOpen(false)
            form.reset()
        } else {
            // Erro - reverter operação otimística se existe
            if (operationId && onServerError) {
                onServerError(operationId, result.error || 'Erro no servidor');
            } else {
                toast.error(result.error || 'Ocorreu um erro ao criar a implementação.')
            }
        }
    } catch (error) {
        // Erro inesperado - reverter operação otimística se existe
        if (operationId && onServerError) {
            onServerError(operationId, 'Erro inesperado');
        } else {
            toast.error('Ocorreu um erro inesperado. Tente novamente.')
        }
    } finally {
        setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nova Implementação de Módulo</DialogTitle>
          <DialogDescription>
            Crie uma nova variação de um módulo base para atender a diferentes
            necessidades ou clientes.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="base_module_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Módulo Base</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!!initialModuleId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o módulo base..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {baseModules
                        .filter(module => module.is_active && !module.archived_at && !module.deleted_at)
                        .map((module) => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Implementação</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Implementação para Clientes Enterprise" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea variant="default" placeholder="Descreva o propósito e as funcionalidades desta implementação." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="implementation_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2 pt-1">
                        Chave da Implementação
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Identificador técnico único para esta implementação. Usado para carregar o módulo dinamicamente.
                                <br />
                                Ex: <code>banban-default</code>, <code>custom-client-x</code>
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: enterprise-v2" {...field} className='mt-3'/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Versão</FormLabel>
                      <FormControl>
                        <Input placeholder="1.0.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>

            <FormField
              control={form.control}
              name="component_path"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 pt-1">
                    Caminho do Componente
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Caminho para o arquivo do componente React que renderiza esta implementação.
                            <br />
                            Ex: <code>@/clients/banban/modules/MyModule</code>
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: /implementations/EnterpriseV2" {...field} className='mt-3'/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="audience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Público-Alvo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                    <FormLabel>Nível de Complexidade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="basic">Básico</SelectItem>
                        <SelectItem value="standard">Padrão</SelectItem>
                        <SelectItem value="advanced">Avançado</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Baixa</SelectItem>
                          <SelectItem value="medium">Média</SelectItem>
                          <SelectItem value="high">Alta</SelectItem>
                          <SelectItem value="critical">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
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
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Implementação Padrão</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Marque se esta deve ser a implementação padrão para o módulo base.
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  'Criar Implementação'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}