'use client';

import { useState, useEffect } from 'react';
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
  Edit,
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
import { updateBaseModule } from '@/app/actions/admin/modules/base-modules';
import { UpdateBaseModuleFormSchema } from '@/app/actions/admin/modules/schemas';
import { Badge } from '@/shared/ui/badge';

// Tipo do módulo base
interface BaseModule {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  route_pattern?: string;
  permissions_required?: string[];
  supports_multi_tenant?: boolean;
  config_schema?: any;
  dependencies?: string[];
  version?: string;
  tags?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Tipo inferido do schema
type UpdateBaseModuleForm = z.infer<typeof UpdateBaseModuleFormSchema>;

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
const IconRenderer = ({name, ...props }: { name: string } & LucideProps) => {
  const { toast } = useToast();
  const LucideIcon = iconComponents[name];
  if (!LucideIcon) {
    return <Package {...props} />; // Ícone padrão
  }
  return <LucideIcon {...props} />;
};

interface EditBaseModuleDialogProps {
  module: BaseModule;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function EditBaseModuleDialog({ module, onSuccess, trigger }: EditBaseModuleDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateBaseModuleForm>({
    resolver: zodResolver(UpdateBaseModuleFormSchema),
    mode: 'onChange',
    defaultValues: {
      name: module.name || '',
      slug: module.slug || '',
      description: module.description || '',
      category: module.category || '',
      icon: module.icon || 'Package',
      route_pattern: module.route_pattern || '',
      permissions_required: Array.isArray(module.permissions_required) ? module.permissions_required : [],
      supports_multi_tenant: module.supports_multi_tenant ?? true,
      config_schema: module.config_schema || {},
      dependencies: Array.isArray(module.dependencies) ? module.dependencies : [],
      version: module.version || '1.0.0',
      tags: Array.isArray(module.tags) ? module.tags : [],
    },
  });

  // Resetar form quando módulo mudar
  useEffect(() => {
    form.reset({
      name: module.name || '',
      slug: module.slug || '',
      description: module.description || '',
      category: module.category || '',
      icon: module.icon || 'Package',
      route_pattern: module.route_pattern || '',
      permissions_required: Array.isArray(module.permissions_required) ? module.permissions_required : [],
      supports_multi_tenant: module.supports_multi_tenant ?? true,
      config_schema: module.config_schema || {},
      dependencies: Array.isArray(module.dependencies) ? module.dependencies : [],
      version: module.version || '1.0.0',
      tags: Array.isArray(module.tags) ? module.tags : [],
    });
  }, [module, form]);

  const onSubmit = async (data: UpdateBaseModuleForm) => {
    setIsSubmitting(true);
    
    try {
      // Garantir que arrays sejam sempre arrays válidos
      const sanitizedData = {
        ...data,
        id: module.id,
        dependencies: Array.isArray(data.dependencies) ? data.dependencies : [],
        tags: Array.isArray(data.tags) ? data.tags : [],
        permissions_required: Array.isArray(data.permissions_required) ? data.permissions_required : [],
      };
      const result = await updateBaseModule(sanitizedData);
      
      if (result.success) {
        toast.success(`O módulo base "${data.name}" foi atualizado.`, {
          title: 'Módulo atualizado com sucesso!',
        });
        
        setOpen(false);
        onSuccess?.();
      } else {
        toast.error(result.error || 'Ocorreu um erro inesperado.', {
          title: 'Erro ao atualizar módulo',
        });
      }
    } catch (error) {
      toast.error('Ocorreu um erro inesperado.', {
        title: 'Erro ao chamar a ação do servidor',
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
    <Button variant="ghost" size="sm" className="flex items-center gap-2">
      <Edit className="w-4 h-4" />
      Editar
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Módulo Base</DialogTitle>
          <DialogDescription>
            Edite as configurações do módulo base "{module.name}".
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
                      <Input placeholder="ex: Performance Analytics" {...field} />
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
                      Slug (URL) *
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="left">
                            <p className="max-w-xs">
                              O slug é o identificador único do módulo usado na URL.
                              Não pode ser alterado após a criação para manter a consistência.
                              <br />
                              Ex: /modules/<b>{field.value || 'meu-modulo'}</b>
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <span className="ml-2 text-xs text-muted-foreground flex-1 text-right">
                        Não pode ser alterado
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="ex: performance-analytics" {...field} disabled className="mt-3" />
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
                      Padrão de Rota *
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p className="max-w-xs">
                              Define os caminhos internos do módulo, como 'dashboard' ou 'settings'.
                              Este padrão será combinado com o slug para formar a URL final.
                              <br />
                              Ex: /modules/[slug]/<b>{field.value || 'dashboard'}</b>
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="dashboard"
                        textLeft="[slug]/"
                        className='mt-3'
                        {...field}
                      />
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
                    <FormDescription>
                      Versão semântica (ex: 1.0.0)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Configurações Avançadas */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Configurações Avançadas</h4>
              
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
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}