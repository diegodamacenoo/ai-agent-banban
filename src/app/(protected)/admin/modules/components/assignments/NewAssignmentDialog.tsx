'use client';

import { useActionState, useState, useMemo, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { useFormStatus } from 'react-dom';
import { useToast } from '@/shared/ui/toast';
import { createSimpleTenantModuleAssignment } from '@/app/actions/admin/modules/tenant-module-assignments';

// Tipos replicados para evitar import circular ou dependências complexas
interface BaseModule {
  id: string;
  name: string;
  category: string;
}

interface ModuleImplementation {
  id: string;
  base_module_id: string;
  name: string;
}

interface TenantGroup {
  tenantId: string;
  organizationName: string;
  assignments: { base_module_id: string }[];
}

interface Organization {
  id: string;
  company_trading_name?: string;
  company_legal_name?: string;
  name?: string;
  slug?: string;
  client_type?: string;
  created_at?: string;
  updated_at?: string;
}

interface NewAssignmentDialogProps {
  initialTenantId?: string;
  tenants: TenantGroup[];
  organizations: Organization[];
  baseModules: BaseModule[];
  implementations: ModuleImplementation[];
  trigger: React.ReactNode;
  onAssignmentCreated?: () => void;
  onOptimisticCreate?: (newAssignment: any) => string;
  onServerSuccess?: (operationId: string, serverData?: any) => void;
  onServerError?: (operationId: string, errorMessage: string) => void;
}

const initialState = { message: '' };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Salvando...' : 'Salvar Atribuição'}
    </Button>
  );
}

export function NewAssignmentDialog({initialTenantId,
  tenants,
  organizations,
  baseModules,
  implementations,
  trigger,
  onAssignmentCreated,
  onOptimisticCreate,
  onServerSuccess,
  onServerError,
}: NewAssignmentDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  
  // Wrapper para action otimística
  const optimisticFormAction = async (prevState: any, formData: FormData) => {
    try {
      // Extrair dados do formulário 
      const tenantId = formData.get('tenantId') as string;
      const baseModuleId = formData.get('baseModuleId') as string;
      const implementationId = formData.get('implementationId') as string;
      const customConfigStr = formData.get('customConfig') as string;
      
      // Validar se não são valores de placeholder
      if (!tenantId || !baseModuleId || !implementationId || 
          tenantId.startsWith('no-') || baseModuleId.startsWith('no-') || implementationId.startsWith('no-')) {
        toast.error('Por favor, selecione todos os campos obrigatórios.');
        return { message: 'Por favor, selecione todos os campos obrigatórios.' };
      }
    
      let operationId: string | undefined;

      // Encontrar dados para o assignment otimístico
      const selectedModule = baseModules.find(m => m.id === baseModuleId);
      const selectedImpl = implementations.find(i => i.id === implementationId);
      const selectedOrg = organizations.find(o => o.id === tenantId);

      // Verificar se já existe assignment (dupla verificação)
      const selectedTenant = tenants.find(t => t.tenantId === tenantId);
      const hasExistingAssignment = selectedTenant?.assignments.some(a => a.base_module_id === baseModuleId);

      if (hasExistingAssignment) {
        toast.error('Este módulo já está atribuído a esta organização.');
        return { message: 'Este módulo já está atribuído a esta organização.' };
      }

      if (onOptimisticCreate && selectedModule && selectedImpl && selectedOrg) {
        // Criar assignment otimístico
        const optimisticAssignment = {
          tenant_id: tenantId,
          base_module_id: baseModuleId,
          implementation_id: implementationId,
          organization_name: selectedOrg.company_trading_name || selectedOrg.name || 'Organização',
          organization_slug: selectedOrg.slug || '',
          module_slug: selectedModule.name.toLowerCase().replace(/\s+/g, '-'),
          module_name: selectedModule.name,
          module_category: selectedModule.category,
          implementation_key: selectedImpl.name.toLowerCase().replace(/\s+/g, '-'),
          implementation_name: selectedImpl.name,
          component_path: '',
          assignment_active: true,
          custom_config: customConfigStr ? JSON.parse(customConfigStr) : {},
          assigned_at: new Date().toISOString(),
        };
        
        operationId = onOptimisticCreate(optimisticAssignment);

        // Fechar diálogo imediatamente e chamar callback
        toast.success('Atribuição criada com sucesso!');
        setIsOpen(false);
        onAssignmentCreated?.();
      }

      // Server action em background
      const result = await createSimpleTenantModuleAssignment(prevState, formData);

      if (result.message.includes('sucesso')) {
        // Confirmar operação otimística
        if (operationId && onServerSuccess) {
          onServerSuccess(operationId);
        }

        // Se não usou otimístico, fazer callback tradicional
        if (!onOptimisticCreate) {
          onAssignmentCreated?.();
          setIsOpen(false);
        }
      } else {
        // Reverter operação otimística
        if (operationId && onServerError) {
          onServerError(operationId, result.message || 'Erro no servidor');
        }
      }

      return result;
    } catch (error) {
      // Reverter operação otimística em caso de erro
      if (operationId && onServerError) {
        onServerError(operationId, 'Erro de conexão');
      }
      return { message: 'Erro ao criar atribuição' };
    }
  };

  const [state, formAction] = useActionState(optimisticFormAction, initialState);

  const [selectedTenantId, setSelectedTenantId] = useState(initialTenantId || '');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [selectedImplementationId, setSelectedImplementationId] = useState<string>('');
  const [customConfig, setCustomConfig] = useState('');

  const selectedOrganization = useMemo(() => 
    (organizations || []).find(org => org.id === selectedTenantId),
    [organizations, selectedTenantId]
  );

  // Busca assignments existentes para a organização selecionada
  const existingAssignments = useMemo(() => {
    const selectedTenant = (tenants || []).find(t => t.tenantId === selectedTenantId);
    return selectedTenant?.assignments.map(a => a.base_module_id) || [];
  }, [tenants, selectedTenantId]);

  const availableModules = useMemo(() => 
    (baseModules || [])
      .filter(bm => bm.is_active && !bm.archived_at && !bm.deleted_at)
      .filter(bm => !existingAssignments.includes(bm.id)),
    [baseModules, existingAssignments]
  );

  const availableImplementations = useMemo(() => {
    if (!selectedModuleId) return [];
    return (implementations || []).filter(impl => impl.base_module_id === selectedModuleId);
  }, [implementations, selectedModuleId]);

  useEffect(() => {
    if (state.message.includes('sucesso')) {
      onAssignmentCreated?.();
      setIsOpen(false);
    }
  }, [state.message, onAssignmentCreated]);

  useEffect(() => {
    if (isOpen) {
      setSelectedTenantId(initialTenantId || '');
      setSelectedModuleId('');
      setSelectedImplementationId('');
      setCustomConfig('');
      if (state.message) initialState.message = '';
    }
  }, [isOpen, initialTenantId, state]);
  
  useEffect(() => {
    setSelectedModuleId('');
    setSelectedImplementationId('');
  }, [selectedTenantId]);

  useEffect(() => {
    setSelectedImplementationId('');
  }, [selectedModuleId]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form action={formAction}>
          <input type="hidden" name="tenantId" value={selectedTenantId} />
          <DialogHeader>
            <DialogTitle>Nova Atribuição de Módulo</DialogTitle>
            <DialogDescription>
              Atribua um novo módulo a uma organização.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 my-4">
            <div className="space-y-2">
              <Label htmlFor="tenantId">Organização</Label>
              <Select
                name="tenantId"
                value={selectedTenantId}
                onValueChange={setSelectedTenantId}
                required
                disabled={!!initialTenantId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma organização" />
                </SelectTrigger>
                <SelectContent>
                  {(!organizations || organizations.length === 0) ? (
                    <SelectItem value="no-data" disabled>
                      Nenhuma organização encontrada (Debug: {organizations?.length || 0} items)
                    </SelectItem>
                  ) : (
                    organizations.map((org, index) => {
                      const displayName = org.company_trading_name || org.company_legal_name || org.name || org.slug || `Org ${index}`;
                      return (
                        <SelectItem key={org.id} value={org.id}>
                          {displayName}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseModuleId">Módulo Base</Label>
              <Select
                name="baseModuleId"
                value={selectedModuleId}
                onValueChange={setSelectedModuleId}
                required
                disabled={!selectedTenantId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedTenantId ? "Selecione um módulo" : "Selecione uma organização primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {availableModules.length === 0 ? (
                    <SelectItem value="no-available-modules" disabled>
                      {!selectedTenantId ? 'Selecione uma organização primeiro' : 'Nenhum módulo disponível'}
                    </SelectItem>
                  ) : (
                    availableModules.map(module => (
                      <SelectItem key={module.id} value={module.id}>
                        {module.name} ({module.category})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="implementationId">Implementação</Label>
              <Select
                name="implementationId"
                value={selectedImplementationId}
                onValueChange={setSelectedImplementationId}
                required
                disabled={!selectedModuleId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedModuleId ? "Selecione uma implementação" : "Selecione um módulo primeiro"} />
                </SelectTrigger>
                <SelectContent>
                  {availableImplementations.length === 0 ? (
                    <SelectItem value="no-data" disabled>
                      {!selectedModuleId ? 'Selecione um módulo primeiro' : 'Nenhuma implementação disponível'}
                    </SelectItem>
                  ) : (
                    availableImplementations.map(impl => (
                      <SelectItem key={impl.id} value={impl.id}>
                        {impl.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customConfig">Configuração Personalizada (JSON - Opcional)</Label>
              <Textarea
                name="customConfig"
                placeholder='{ "feature_flag": true }'
                value={customConfig}
                onChange={(e) => setCustomConfig(e.target.value)}
                rows={5}
              />
            </div>

            {state?.message && !state.message.includes('sucesso') && (
              <p className="text-red-500 text-sm">{state.message}</p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

