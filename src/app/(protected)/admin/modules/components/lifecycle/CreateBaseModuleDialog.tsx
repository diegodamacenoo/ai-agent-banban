'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import {
  Plus,
  Loader2,
  Info,
  Package,
  BarChart3,
  Activity,
  Settings,
  Bell,
  Users,
  Shield,
  Zap,
  Database,
  Globe,
  type LucideProps,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/ui/tooltip';
import { useToast } from '@/shared/ui/toast';

// Import das server actions
import { createBaseModule } from '@/app/actions/admin/modules/base-modules';
import { CreateBaseModuleSchema } from '@/app/actions/admin/modules/schemas';

// Import dos componentes e hooks
import { useSystemConfig } from '../../hooks/useSystemConfig';
import { AutoConfigSwitch } from '../shared/AutoConfigSwitch';

// Tipo inferido do schema
type CreateBaseModuleForm = z.infer<typeof CreateBaseModuleSchema>;

interface CreateBaseModuleDialogProps {
  onSuccess?: () => void;
  onOptimisticCreate?: (newModule: any) => string;
  onServerSuccess?: (operationId: string, serverData?: any) => void;
  onServerError?: (operationId: string, errorMessage: string) => void;
  trigger?: React.ReactNode;
}

// Mapeamento de nomes de ícones para componentes
const iconComponents: { [key: string]: React.ComponentType<LucideProps> } = {
  Package,
  BarChart3,
  Activity,
  Settings,
  Bell,
  Users,
  Shield,
  Zap,
  Database,
  Globe,
};

// Componente para renderizar o ícone dinamicamente
const IconRenderer = ({ name, ...props }: { name: string } & LucideProps) => {
  const LucideIcon = iconComponents[name];
  if (!LucideIcon) {
    return <Package {...props} />; // Ícone padrão
  }
  return <LucideIcon {...props} />;
};

export function CreateBaseModuleDialog({ 
  onSuccess, 
  onOptimisticCreate, 
  onServerSuccess, 
  onServerError, 
  trigger 
}: CreateBaseModuleDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Configurações do sistema
  const { config, isVersioningEnabled } = useSystemConfig();
  const [isVersionAuto, setIsVersionAuto] = useState(true);

  const form = useForm<CreateBaseModuleForm>({
    resolver: zodResolver(CreateBaseModuleSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      category: '',
      icon: 'Package',
      route_pattern: '',
      permissions_required: [],
      supports_multi_tenant: true,
      config_schema: {},
      dependencies: [],
      version: '1.0.0',
      tags: [],
      auto_create_standard: true,
    },
  });

  // Gerar slug automaticamente baseado no nome
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const onSubmit = async (data: CreateBaseModuleForm) => {
    setIsSubmitting(true);

    try {
      // Gerar slug se não fornecido
      if (!data.slug || data.slug === '') {
        data.slug = generateSlug(data.name);
      }

      // Marcar se versão deve ser automática (para o auto-config-applier saber)
      if (isVersionAuto && isVersioningEnabled) {
        data.version = '1.0.0'; // Valor padrão, será sobrescrito pelo auto-config
        (data as any).__useAutoVersion = true;
      }

      const hasOptimisticCallbacks = onOptimisticCreate && onServerSuccess && onServerError;
      let operationId: string | null = null;

      // MODO OTIMÍSTICO: Se há todos os callbacks necessários
      if (hasOptimisticCallbacks) {
        // Criar objeto do módulo para o estado otimístico
        const optimisticModule = {
          id: `temp-${Date.now()}`, // ID temporário
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          category: data.category,
          icon: data.icon || 'Package',
          route_pattern: data.route_pattern || '',
          permissions_required: data.permissions_required || [],
          supports_multi_tenant: data.supports_multi_tenant ?? true,
          config_schema: data.config_schema || {},
          dependencies: data.dependencies || [],
          version: data.version || '1.0.0',
          tags: data.tags || [],
          status: 'active',
          is_active: true,
          archived_at: null,
          deleted_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Aplicar update otimístico
        operationId = onOptimisticCreate(optimisticModule);
        console.log('🚀 MODO OTIMÍSTICO: Módulo criado otimisticamente:', operationId);

        // UI cleanup imediato (sem toast ainda, sem onSuccess para evitar reload)
        form.reset();
        setOpen(false);

        // Server action em background
        try {
          const result = await createBaseModule(data);

          if (result.success) {
            // Confirmar operação otimística
            onServerSuccess(operationId, result.data);
            console.log('✅ MODO OTIMÍSTICO: Confirmado pelo servidor:', operationId);
            
            // Toast de sucesso apenas após confirmação
            toast.success(`O módulo base "${data.name}" foi criado e está disponível para implementações.`, {
              title: 'Módulo criado com sucesso!',
            });
          } else {
            // Reverter operação otimística
            onServerError(operationId, result.error || 'Erro no servidor');
            console.log('❌ MODO OTIMÍSTICO: Erro do servidor, revertendo:', operationId);
          }
        } catch (serverError) {
          // Reverter operação otimística em caso de exceção
          onServerError(operationId, 'Erro inesperado na conexão');
          console.error('❌ MODO OTIMÍSTICO: Exceção do servidor:', serverError);
        }

      } else {
        // MODO TRADICIONAL: Sem estado otimístico
        console.log('🔄 MODO TRADICIONAL: Criando módulo...');
        
        const result = await createBaseModule(data);

        if (result.success) {
          toast.success(`O módulo base "${data.name}" foi criado e está disponível para implementações.`, {
            title: 'Módulo criado com sucesso!',
          });

          form.reset();
          setOpen(false);
          onSuccess?.();
        } else {
          toast.error(result.error || 'Ocorreu um erro inesperado.', {
            title: 'Erro ao criar módulo',
          });
        }
      }

    } catch (error) {
      console.debug('Erro geral ao criar módulo base:', error);
      toast.error('Ocorreu um erro inesperado. Tente novamente.', {
        title: 'Erro ao criar módulo',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const categorias = [
    'analytics',
    'intelligence',
    'monitoring',
    'operations',
    'reporting',
    'automation',
    'integration',
    'security'
  ];

  const icones = Object.keys(iconComponents);

  const defaultTrigger = (
    <Button className="flex items-center gap-2">
      <Plus className="w-4 h-4" />
      Novo Módulo Base
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Módulo Base</DialogTitle>
          <DialogDescription>
            Crie um novo módulo base que servirá como fundação para implementações específicas.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Nome e Slug */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Módulo *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Performance Analytics"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          // Auto-gerar slug
                          const slug = generateSlug(e.target.value);
                          form.setValue('slug', slug);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex align-left gap-2 pt-1">
                      Identificador *
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p className="max-w-xs">
                              Identificador único interno usado no código e banco de dados.
                              <br />
                              • Formato: apenas letras minúsculas, números e hífen
                              <br />
                              • Não pode ser alterado após criação
                              <br />
                              • Exemplo: "performance-analytics"
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="ml-2 text-xs text-muted-foreground flex-1 text-right">
                        Não poderá ser alterado
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="performance-analytics" {...field} className="mt-3" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Descrição */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a funcionalidade e objetivo deste módulo..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categoria e Ícone */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((categoria) => (
                          <SelectItem key={categoria} value={categoria}>
                            {categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ícone */}
              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ícone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue asChild>
                            <div className="flex items-center gap-2">
                              <IconRenderer name={field.value || 'Package'} className="w-4 h-4" />
                              <span>{field.value}</span>
                            </div>
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {icones.map((icone) => (
                          <SelectItem key={icone} value={icone}>
                            <div className="flex items-center gap-2">
                              <IconRenderer name={icone} className="w-4 h-4" />
                              <span>{icone}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Padrão de Rota e Versão */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="route_pattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex align-left gap-2 pt-1">
                      URL de Acesso *
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p className="max-w-xs">
                              Como o módulo aparecerá na URL do navegador dos usuários.
                              <br />
                              • Pode incluir barras para hierarquia
                              <br />
                              • Pode ser alterado posteriormente
                              <br />
                              • Exemplo: "/performance" ou "/vendas/analytics"
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="performance"
                        className='mt-3'
                        textLeft="/tenant/"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Versão - Com opção automática */}
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versão</FormLabel>
                    <FormControl>
                      <AutoConfigSwitch
                        field="version"
                        isAutoEnabled={isVersioningEnabled}
                        autoValue="1.0.0"
                        onModeChange={setIsVersionAuto}
                        initialIsAuto={isVersionAuto}
                        description="Versão semântica inicial do módulo"
                      >
                        <Input 
                          placeholder="ex: 1.0.0" 
                          {...field} 
                          disabled={isVersionAuto}
                        />
                      </AutoConfigSwitch>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Configurações Avançadas */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Configurações Avançadas</h4>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="supports_multi_tenant"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Multi-tenant</FormLabel>
                        <FormDescription>
                          Suporta múltiplos tenants
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

                <FormField
                  control={form.control}
                  name="auto_create_standard"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Implementação Standard</FormLabel>
                        <FormDescription>
                          Criar automaticamente implementação padrão
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
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Módulo Base
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}