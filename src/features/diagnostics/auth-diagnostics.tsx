"use client";

import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/core/supabase/client';
import { createLogger } from '@/shared/utils/logger';
import { DEBUG_MODULES } from '@/shared/utils/debug-config';

const logger = createLogger(DEBUG_MODULES.AUTH);

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export function AuthDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnosticResults: DiagnosticResult[] = [];

    // Teste 1: Verificar variáveis de ambiente
    logger.info("Executando diagnóstico de variáveis de ambiente...");
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        diagnosticResults.push({
          test: "Variáveis de Ambiente",
          status: "error",
          message: "Variáveis NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não estão definidas",
          details: { supabaseUrl: !!supabaseUrl, supabaseAnonKey: !!supabaseAnonKey }
        });
      } else {
        diagnosticResults.push({
          test: "Variáveis de Ambiente",
          status: "success",
          message: "Variáveis de ambiente configuradas corretamente",
          details: { 
            supabaseUrl: `${supabaseUrl.substring(0, 30)  }...`, 
            supabaseAnonKey: `${supabaseAnonKey.substring(0, 20)  }...` 
          }
        });
      }
    } catch (error) {
      diagnosticResults.push({
        test: "Variáveis de Ambiente",
        status: "error",
        message: "Erro ao verificar variáveis de ambiente",
        details: error
      });
    }

    // Teste 2: Criar cliente Supabase
    logger.info("Executando diagnóstico de criação do cliente...");
    try {
      const supabase = createSupabaseBrowserClient();
      diagnosticResults.push({
        test: "Cliente Supabase",
        status: "success",
        message: "Cliente Supabase criado com sucesso"
      });

      // Teste 3: Verificar usuário atual (mais seguro)
      logger.info("Executando diagnóstico de usuário...");
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          diagnosticResults.push({
            test: "Usuário Atual (getUser)",
            status: "warning",
            message: "Erro ao obter usuário atual",
            details: userError
          });
        } else if (!user) {
          diagnosticResults.push({
            test: "Usuário Atual (getUser)",
            status: "warning",
            message: "Nenhum usuário autenticado encontrado"
          });
        } else {
          diagnosticResults.push({
            test: "Usuário Atual (getUser)",
            status: "success",
            message: "Usuário autenticado encontrado",
            details: {
              userId: user.id,
              email: user.email,
              emailConfirmed: user.email_confirmed_at ? true : false,
              lastSignIn: user.last_sign_in_at
            }
          });

          // Teste 5: Verificar perfil do usuário
          logger.info("Executando diagnóstico de perfil...");
          try {
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', user.id)
              .single();

            if (profileError) {
              diagnosticResults.push({
                test: "Perfil do Usuário",
                status: "error",
                message: "Erro ao buscar perfil do usuário",
                details: profileError
              });
            } else if (!profile) {
              diagnosticResults.push({
                test: "Perfil do Usuário",
                status: "warning",
                message: "Perfil não encontrado para o usuário"
              });
            } else {
              diagnosticResults.push({
                test: "Perfil do Usuário",
                status: "success",
                message: "Perfil encontrado com sucesso",
                details: {
                  firstName: profile.first_name,
                  lastName: profile.last_name,
                  role: profile.role,
                  organizationId: profile.organization_id
                }
              });
            }
          } catch (error) {
            diagnosticResults.push({
              test: "Perfil do Usuário",
              status: "error",
              message: "Erro ao verificar perfil",
              details: error
            });
          }
        }
      } catch (error) {
        diagnosticResults.push({
          test: "Usuário Atual (getUser)",
          status: "error",
          message: "Erro ao verificar usuário",
          details: error
        });
      }

    } catch (error) {
      diagnosticResults.push({
        test: "Cliente Supabase",
        status: "error",
        message: "Erro ao criar cliente Supabase",
        details: error
      });
    }

    setResults(diagnosticResults);
    setIsRunning(false);
    logger.info("Diagnóstico de autenticação concluído", diagnosticResults);
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Diagnóstico de Autenticação</h2>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isRunning ? 'Executando...' : 'Executar Novamente'}
        </button>
      </div>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span>{getStatusIcon(result.status)}</span>
              <h3 className="font-medium">{result.test}</h3>
            </div>
            <p className={`mb-2 ${getStatusColor(result.status)}`}>
              {result.message}
            </p>
            {result.details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                  Ver detalhes
                </summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {results.length === 0 && !isRunning && (
        <div className="text-center text-gray-500 py-8">
          Nenhum resultado disponível. Clique em "Executar Novamente" para iniciar o diagnóstico.
        </div>
      )}
    </div>
  );
} 