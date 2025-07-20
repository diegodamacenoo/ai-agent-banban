'use client';

import { useState } from 'react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Loader2, TestTube, CheckCircle, AlertTriangle } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { safeGetUser } from '@/core/supabase/auth-helpers';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';

export function APITester() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  const runTests = async () => {
    setIsLoading(true);
    setError(null);
    setResults([]);
    
    const testResults: any[] = [];

    try {
      // Teste 1: Verificar autenticaÃ§Ã£o
      console.debug('ðŸ" Teste 1: Verificando autenticaÃ§Ã£o...');
      const { user, error: authError } = await safeGetUser();
      
      testResults.push({
        test: 'AutenticaÃ§Ã£o',
        success: !authError && user,
        message: authError ? authError : user ? `UsuÃ¡rio: ${user.email}` : 'UsuÃ¡rio nÃ£o encontrado',
        details: { user: user?.id, email: user?.email }
      });

      if (!user) {
        throw new Error(authError || 'UsuÃ¡rio nÃ£o autenticado');
      }

      // Teste 2: Verificar estrutura da tabela organizations
      console.debug('ðŸ" Teste 2: Verificando estrutura da tabela organizations...');
      const { data: orgsCount, error: countError } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true });

      testResults.push({
        test: 'Estrutura da tabela organizations',
        success: !countError,
        message: countError ? countError.message : `Tabela acessÃvel - ${orgsCount} registros`,
        details: { count: orgsCount, error: countError }
      });

      // Teste 3: Verificar existÃªncia de colunas multi-tenant
      console.debug('ðŸ" Teste 3: Verificando colunas multi-tenant...');
      const { data: sampleOrg, error: sampleError } = await supabase
        .from('organizations')
        .select('id, company_legal_name, company_trading_name, client_type, custom_backend_url, implementation_config')
        .limit(1)
        .maybeSingle();

      testResults.push({
        test: 'Colunas multi-tenant',
        success: !sampleError,
        message: sampleError ? sampleError.message : 'Colunas multi-tenant encontradas',
        details: { sampleOrg, error: sampleError }
      });

      // Teste 4: InserÃ§Ã£o bÃ¡sica
      console.debug('ðŸ" Teste 4: Teste de inserÃ§Ã£o bÃ¡sica...');
      const testData = {
        company_legal_name: `Teste API Ltda ${Date.now()}`,
        company_trading_name: 'Teste API'
      };

      const { data: insertResult, error: insertError } = await supabase
        .from('organizations')
        .insert(testData)
        .select()
        .single();

      testResults.push({
        test: 'InserÃ§Ã£o bÃ¡sica',
        success: !insertError,
        message: insertError ? insertError.message : 'InserÃ§Ã£o bÃ¡sica funcionou',
        details: { insertResult, error: insertError }
      });

      // Teste 5: Limpeza
      if (insertResult && !insertError) {
        console.debug('ð§¹ Limpando dados de teste...');
        await supabase
          .from('organizations')
          .delete()
          .eq('id', insertResult.id);
      }

      // Teste 6: InserÃ§Ã£o com campos multi-tenant
      console.debug('ðŸ" Teste 6: InserÃ§Ã£o com campos multi-tenant...');
      const multiTenantData = {
        company_legal_name: `Teste Multi-Tenant Ltda ${Date.now()}`,
        company_trading_name: 'Teste MT',
        client_type: 'custom',
        custom_backend_url: 'http://localhost:4000',
        implementation_config: {
          enabled_modules: ['test']
        },
        is_implementation_complete: false
      };

      const { data: mtResult, error: mtError } = await supabase
        .from('organizations')
        .insert(multiTenantData)
        .select()
        .single();

      testResults.push({
        test: 'InserÃ§Ã£o multi-tenant',
        success: !mtError,
        message: mtError ? mtError.message : 'InserÃ§Ã£o multi-tenant funcionou',
        details: { mtResult, error: mtError }
      });

      // Limpeza final
      if (mtResult && !mtError) {
        console.debug('ð§¹ Limpando dados multi-tenant...');
        await supabase
          .from('organizations')
          .delete()
          .eq('id', mtResult.id);
      }

      setResults(testResults);

    } catch (error) {
      console.error('â Erro nos testes:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      setResults(testResults);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Testador de API Multi-Tenant
        </CardTitle>
        <CardDescription>
          Testa a conexÃ£o com Supabase e estrutura multi-tenant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro nos Testes</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Resultados dos Testes:</h4>
            {results.map((result, index) => (
              <div key={index} className={`p-3 rounded border ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="font-medium">{result.test}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">Detalhes</summary>
                    <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <Button 
          onClick={runTests} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executando Testes...
            </>
          ) : (
            <>
              <TestTube className="mr-2 h-4 w-4" />
              Executar Testes de API
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
} 
