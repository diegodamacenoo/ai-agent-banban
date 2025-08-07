'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Button } from '@/shared/ui/button';
import { Checkbox } from '@/shared/ui/checkbox';
import { Badge } from '@/shared/ui/badge';
import { 
  Building2, 
  Plus, 
  AlertCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useModuleWizardContext } from '../../../contexts/ModuleWizardContext';
import { getAllOrganizations } from '@/app/actions/admin/organizations';

/**
 * Step 5: Atribuição de Cliente - cria a atribuição do módulo para uma organização específica.
 * - Mostra organizações reais do banco de dados
 * - Permite selecionar organização target
 * - Cria atribuição inativa automaticamente para desenvolvimento
 */
interface Organization {
  id: string;
  company_trading_name?: string;
  company_legal_name?: string;
  slug?: string;
  client_type?: string;
  custom_backend_url?: string;
  is_implementation_complete?: boolean;
  implementation_date?: string;
  implementation_config?: any;
  created_at?: string;
  updated_at?: string;
}

export function ClientConfigStep() {
  const { state, updateConfig, nextStep } = useModuleWizardContext();
  const [error, setError] = useState<string | null>(null);
  const [createAssignment, setCreateAssignment] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  // Carregar organizações na montagem do componente
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const result = await getAllOrganizations();
        console.debug('🔍 Resultado getAllOrganizations:', result);
        
        if (result.data) {
          setOrganizations(result.data);
        } else if (result.error) {
          setError('Falha ao carregar organizações: ' + result.error);
        } else {
          setError('Resposta inesperada da função getAllOrganizations');
        }
      } catch (err) {
        console.error('❌ Erro ao carregar organizações:', err);
        setError('Erro ao carregar organizações: ' + (err instanceof Error ? err.message : 'Erro desconhecido'));
      } finally {
        setIsLoadingOrgs(false);
      }
    };

    loadOrganizations();
  }, []);

  const selectedOrganization = organizations.find(org => org.id === selectedOrgId);

  // Handler para criar nova organização
  const handleCreateNewOrg = () => {
    window.open('/admin/organizations?create=true', '_blank');
  };

  // Apenas salvar configurações no contexto e prosseguir
  const handleProceedWithAssignment = () => {
    // Salvar configurações no contexto para usar no passo final
    const clientAssignmentConfig = {
      createAssignment,
      selectedOrganization: selectedOrganization || null,
    };
    
    updateConfig('client_assignment', clientAssignmentConfig);
    
    console.debug('💾 Configuração de atribuição salva:', clientAssignmentConfig);
    
    // Prosseguir para o próximo step
    nextStep();
  };

  // Expor função para o wizard usar
  useEffect(() => {
    (window as any).__clientConfigStepHandler = handleProceedWithAssignment;
    
    return () => {
      delete (window as any).__clientConfigStepHandler;
    };
  }, [handleProceedWithAssignment]);



  return (
    <div className="space-y-4">
      {/* Header simples */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Atribuição de Organização</h3>
        <p className="text-sm text-muted-foreground">
          Selecione a organização que receberá este módulo.
        </p>
      </div>

      {/* Seleção da organização */}
      <div className="space-y-3">
        <Label>Organização</Label>
        <div className="flex gap-2">
          <Select 
            value={selectedOrgId} 
            onValueChange={setSelectedOrgId}
            disabled={isLoadingOrgs}
          >
            <SelectTrigger className="flex-1">
              <SelectValue 
                placeholder={isLoadingOrgs ? "Carregando..." : "Selecione uma organização"}
              />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((org) => {
                const displayName = org.company_trading_name || org.company_legal_name || org.slug || `Org ${org.id.substring(0, 8)}`;
                
                return (
                  <SelectItem key={org.id} value={org.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      <span>{displayName}</span>
                      {org.client_type === 'custom' && (
                        <Badge variant="secondary" className="text-xs">Custom</Badge>
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="default"
            onClick={handleCreateNewOrg}
            className="px-3"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Checkbox de atribuição automática */}
      {selectedOrganization && (
        <div className="pt-2">
          <div className="flex items-start space-x-3">
            <Checkbox
              checked={createAssignment}
              onCheckedChange={setCreateAssignment}
              className="mt-0.5"
            />
            <div>
              <Label className="text-sm font-medium">
                Criar atribuição automática
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Cria uma atribuição inativa para desenvolvimento. Recomendado para teste.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error display compacto */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}