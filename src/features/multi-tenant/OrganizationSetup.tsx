'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { Loader2, Plus, CheckCircle, AlertTriangle, Database } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { safeGetUser } from '@/core/supabase/auth-helpers';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

interface OrganizationSetupProps {
  onOrganizationCreated?: () => void;
}

export function OrganizationSetup({ onOrganizationCreated }: OrganizationSetupProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [createdOrganizations, setCreatedOrganizations] = useState<any[]>([]);

  const supabase = createSupabaseBrowserClient();

  const createTestOrganizations = async () => {
    setIsLoading(true);
    setStatus('idle');
    setMessage('');
    
    try {
      const { user, error: authError } = await safeGetUser();
      if (authError || !user) {
        throw new Error(authError || 'UsuÃ¡rio nÃ£o autenticado');
      }

      console.debug('ðŸ"§ Criando organizaÃ§Ãµes de teste...');

      // 1. Primeiro, vamos verificar se existem colunas multi-tenant
      console.debug('ðŸ"§ Verificando se colunas multi-tenant existem...');
      
      // Testar uma consulta simples primeiro
      const { data: existingOrgs, error: selectError } = await supabase
        .from('organizations')
        .select('id, company_legal_name, company_trading_name')
        .limit(1);

      if (selectError) {
        console.error('âŒ Erro na consulta bÃ¡sica:', selectError);
        throw selectError;
      }

      console.debug('âœ… Consulta bÃ¡sica funcionou. OrganizaÃ§Ãµes existentes:', existingOrgs?.length || 0);

      // Agora testar inserÃ§Ã£o bÃ¡sica sem campos multi-tenant
      console.debug('ðŸ"§ Testando inserÃ§Ã£o bÃ¡sica...');
      
      const basicOrgData = {
        company_legal_name: `Teste BÃ¡sico Ltda ${Date.now()}`,
        company_trading_name: 'Teste BÃ¡sico'
      };

      const { data: basicTest, error: basicError } = await supabase
        .from('organizations')
        .insert(basicOrgData)
        .select()
        .single();

      if (basicError) {
        console.error('âŒ Erro na inserÃ§Ã£o bÃ¡sica:', basicError);
        throw basicError;
      }

      console.debug('âœ… InserÃ§Ã£o bÃ¡sica funcionou:', basicTest);

      // Agora testar se as colunas multi-tenant existem
      console.debug('ðŸ"§ Testando consulta com colunas multi-tenant...');
      
      const { data: testColumns, error: columnsError } = await supabase
        .from('organizations')
        .select('id, company_legal_name, company_trading_name, client_type, custom_backend_url, implementation_config')
        .eq('id', basicTest.id)
        .single();

      if (columnsError) {
        console.error('âŒ Colunas multi-tenant nÃ£o existem. Erro:', columnsError);
        console.debug('ðŸ"§ Tentando inserÃ§Ã£o sem colunas multi-tenant...');
        
        // Usar apenas os dados bÃ¡sicos se colunas multi-tenant nÃ£o existem
        const standardOrgData = {
          company_legal_name: `SaaS PadrÃ£o Ltda ${Date.now()}`,
          company_trading_name: 'SaaS PadrÃ£o'
        };

        const { data: standardOrg, error: standardOrgError } = await supabase
          .from('organizations')
          .insert(standardOrgData)
          .select()
          .single();

        if (standardOrgError) {
          throw standardOrgError;
        }

        // Limpar teste bÃ¡sico
        await supabase.from('organizations').delete().eq('id', basicTest.id);

        setCreatedOrganizations([standardOrg]);
        setStatus('success');
        setMessage('âš ï¸ Sistema configurado com schema bÃ¡sico. Colunas multi-tenant precisam ser criadas.');
        
        if (onOrganizationCreated) {
          onOrganizationCreated();
        }
        return;
      }

      console.debug('âœ… Colunas multi-tenant existem:', testColumns);

      // Se chegou atÃ© aqui, as colunas existem. Continuar com inserÃ§Ã£o multi-tenant
      const customOrgData = {
        company_legal_name: `Teste OrganizaÃ§Ã£o Ltda ${Date.now()}`,
        company_trading_name: 'Teste Org',
        client_type: 'custom',
        custom_backend_url: 'http://localhost:4000',
        implementation_config: {
          enabled_modules: ['analytics', 'performance', 'inventory'],
          custom_features: ['advanced_reporting', 'real_time_sync']
        },
        is_implementation_complete: true,
        implementation_date: new Date().toISOString(),
        implementation_team_notes: 'OrganizaÃ§Ã£o criada automaticamente para testes de integraÃ§Ã£o multi-tenant'
      };

      const { data: customOrg, error: customOrgError } = await supabase
        .from('organizations')
        .insert(customOrgData)
        .select()
        .single();

      if (customOrgError && !customOrgError.message.includes('duplicate')) {
        throw customOrgError;
      }

      // 2. Criar organizaÃ§Ã£o padrÃ£o
      const standardOrgData = {
        company_legal_name: 'SaaS PadrÃ£o Ltda',
        company_trading_name: 'SaaS PadrÃ£o',
        client_type: 'standard',
        implementation_config: {
          enabled_standard_modules: ['analytics', 'reports', 'alerts', 'dashboard']
        },
        is_implementation_complete: true
      };

      const { data: standardOrg, error: standardOrgError } = await supabase
        .from('organizations')
        .insert(standardOrgData)
        .select()
        .single();

      if (standardOrgError && !standardOrgError.message.includes('duplicate')) {
        throw standardOrgError;
      }

      // 3. Limpar organizaÃ§Ã£o de teste bÃ¡sica
      if (basicTest) {
        await supabase
          .from('organizations')
          .delete()
          .eq('id', basicTest.id);
        console.debug('ðŸ§¹ OrganizaÃ§Ã£o de teste bÃ¡sica removida');
      }

      // 4. Buscar organizaÃ§Ãµes existentes se houve conflito
      const { data: existingOrgsFromDB } = await supabase
        .from('organizations')
        .select('*')
        .in('company_trading_name', ['Teste Org', 'SaaS PadrÃ£o']);

      const orgsToUse = existingOrgsFromDB || [];
      if (customOrg) orgsToUse.push(customOrg);
      if (standardOrg) orgsToUse.push(standardOrg);

      // 5. Verificar se o usuÃ¡rio atual tem organizaÃ§Ã£o
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      // 6. Se nÃ£o tem organizaÃ§Ã£o, vincular Ã  organizaÃ§Ã£o customizada
      if (!currentProfile?.organization_id && orgsToUse.length > 0) {
        const customOrgToUse = orgsToUse.find((org: any) => org.client_type === 'custom') || orgsToUse[0];
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ organization_id: customOrgToUse.id })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }

        console.debug('âœ… UsuÃ¡rio vinculado Ã  organizaÃ§Ã£o:', (customOrgToUse as any).company_trading_name);
      }

      setCreatedOrganizations(orgsToUse);
      setStatus('success');
      setMessage(`âœ… ConfiguraÃ§Ã£o concluÃ­da! ${orgsToUse.length} organizaÃ§Ã£o(Ãµes) disponÃ­vel(eis) para teste.`);
      
      if (onOrganizationCreated) {
        onOrganizationCreated();
      }

    } catch (error) {
      console.error('âŒ Erro ao criar organizaÃ§Ãµes:', error);
      console.error('âŒ Tipo do erro:', typeof error);
      console.error('âŒ Detalhes do erro:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Erro desconhecido';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Supabase retorna erros como objetos com propriedades especÃ­ficas
        const errorObj = error as any;
        errorMessage = errorObj.message || errorObj.details || errorObj.hint || JSON.stringify(error);
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setStatus('error');
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCurrentOrganization = async () => {
    try {
      const { user, error: authError } = await safeGetUser();
      if (authError || !user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select(`
          organization_id,
          organizations (
            id,
            company_legal_name,
            company_trading_name,
            client_type,
            custom_backend_url,
            is_implementation_complete
          )
        `)
        .eq('id', user.id)
        .single();

      if (profile?.organizations) {
        const org = Array.isArray(profile.organizations) ? profile.organizations[0] : profile.organizations;
        setCreatedOrganizations([org]);
        setStatus('success');
        setMessage('âœ… OrganizaÃ§Ã£o jÃ¡ configurada!');
      }
    } catch (error) {
      console.error('Erro ao verificar organizaÃ§Ã£o:', error);
    }
  };

  // Verificar organizaÃ§Ã£o ao montar o componente
  useEffect(() => {
    checkCurrentOrganization();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          ConfiguraÃ§Ã£o de OrganizaÃ§Ãµes de Teste
        </CardTitle>
        <CardDescription>
          Configure organizaÃ§Ãµes de teste para validar o sistema multi-tenant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status === 'error' && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro na ConfiguraÃ§Ã£o</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {status === 'success' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>ConfiguraÃ§Ã£o ConcluÃ­da</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {createdOrganizations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">OrganizaÃ§Ãµes DisponÃ­veis:</h4>
            {createdOrganizations.map((org, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div>
                <span className="font-medium">{org.company_trading_name || org.company_legal_name}</span>
                <span className="text-sm text-gray-500 ml-2">
                  ({org.company_legal_name || 'N/A'})
                </span>
              </div>
                <div className="flex items-center gap-2">
                  <Badge variant={org.client_type === 'custom' ? 'default' : 'secondary'}>
                    {org.client_type === 'custom' ? 'Customizado' : 'PadrÃ£o'}
                  </Badge>
                  {org.is_implementation_complete && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={createTestOrganizations} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Configurando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Configurar OrganizaÃ§Ãµes de Teste
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={checkCurrentOrganization}
            disabled={isLoading}
          >
            Verificar Status
          </Button>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>OrganizaÃ§Ã£o Customizada:</strong> Usa backend dedicado (localhost:4000)</p>
          <p><strong>OrganizaÃ§Ã£o PadrÃ£o:</strong> Usa Next.js API Routes</p>
          <p><strong>Nota:</strong> Seu usuÃ¡rio serÃ¡ automaticamente vinculado Ã  organizaÃ§Ã£o customizada</p>
        </div>
      </CardContent>
    </Card>
  );
} 
