'use client';

import { useState } from 'react';
import { debugTenantModules, autoAssignModulesToTenant } from '@/app/actions/debug-tenant';

export default function DebugTenantPage() {
  const [result, setResult] = useState<any>(null);
  const [assignResult, setAssignResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const handleDebug = async () => {
    setLoading(true);
    try {
      const result = await debugTenantModules();
      setResult(result);
      console.log('Debug result:', result);
    } catch (error) {
      setResult({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
    setLoading(false);
  };

  const handleAutoAssign = async () => {
    setAssigning(true);
    try {
      const result = await autoAssignModulesToTenant();
      setAssignResult(result);
      console.log('Auto assign result:', result);
      // Executar debug novamente para ver as mudanças
      setTimeout(() => {
        handleDebug();
      }, 1000);
    } catch (error) {
      setAssignResult({ success: false, error: error instanceof Error ? error.message : 'Erro desconhecido' });
    }
    setAssigning(false);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Debug Tenant Modules</h1>
      
      <div className="flex gap-4 mb-6">
        <button 
          onClick={handleDebug}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Executando Debug...' : 'Executar Debug'}
        </button>

        <button 
          onClick={handleAutoAssign}
          disabled={assigning}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {assigning ? 'Atribuindo Módulos...' : 'Auto-Atribuir Todos os Módulos'}
        </button>
      </div>

      {assignResult && (
        <div className="mt-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Resultado da Auto-Atribuição:</h2>
          <div className="bg-green-50 p-4 rounded border">
            {assignResult.success ? (
              <div>
                <p className="font-semibold text-green-700">✅ Auto-atribuição concluída!</p>
                <ul className="mt-2">
                  {assignResult.results?.map((r: any, i: number) => (
                    <li key={i} className="text-sm">
                      {r.module}: <span className={r.status === 'atribuído' ? 'text-green-600' : r.status === 'erro' ? 'text-red-600' : 'text-gray-600'}>
                        {r.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-red-600">❌ Erro: {assignResult.error}</p>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Resultado do Debug:</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            
            {result.diagnosis && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <h3 className="font-semibold text-yellow-800">Diagnóstico:</h3>
                <p>Tem Assignments: {result.diagnosis.hasAssignments ? '✅' : '❌'}</p>
                <p>Tem Base Modules: {result.diagnosis.hasBaseModules ? '✅' : '❌'}</p>
                <p>Tem Implementations: {result.diagnosis.hasImplementations ? '✅' : '❌'}</p>
                <p className="font-bold">Ação Recomendada: {result.diagnosis.recommendedAction}</p>
              </div>
            )}

            <div className="mb-4">
              <h3 className="font-semibold">Organização:</h3>
              <p>ID: {result.data?.organization?.id}</p>
              <p>Slug: {result.data?.organization?.slug}</p>
              <p>Nome: {result.data?.organization?.company_trading_name}</p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold">Tenant Module Assignments: {result.data?.assignments?.length || 0}</h3>
              {result.data?.assignments?.length > 0 ? (
                <ul className="list-disc pl-5">
                  {result.data.assignments.map((assignment: any, i: number) => (
                    <li key={i}>
                      Module ID: {assignment.base_module_id} - Ativo: {assignment.is_active ? '✅' : '❌'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-600 font-bold">❌ NENHUM ASSIGNMENT ENCONTRADO - Este é o problema!</p>
              )}
            </div>

            <div className="mb-4">
              <h3 className="font-semibold">Base Modules Disponíveis: {result.data?.baseModules?.length || 0}</h3>
              {result.data?.baseModules?.length > 0 ? (
                <ul className="list-disc pl-5">
                  {result.data.baseModules.map((module: any, i: number) => (
                    <li key={i}>
                      {module.slug} - {module.name} (ID: {module.id})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-600">Nenhum base module encontrado</p>
              )}
            </div>

            <div className="mb-4">
              <h3 className="font-semibold">Module Implementations: {result.data?.implementations?.length || 0}</h3>
              {result.data?.implementations?.length > 0 ? (
                <ul className="list-disc pl-5">
                  {result.data.implementations.map((impl: any, i: number) => (
                    <li key={i}>
                      {impl.implementation_key} - Base Module: {impl.base_module_id} - Default: {impl.is_default ? '✅' : '❌'}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-red-600">Nenhuma implementação encontrada</p>
              )}
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold">JSON Completo</summary>
              <pre className="mt-2 text-xs">{JSON.stringify(result, null, 2)}</pre>
            </details>
          </div>
        </div>
      )}

      <div className="mt-8 text-sm text-gray-600 p-4 bg-yellow-50 rounded">
        <h3 className="font-semibold mb-2">🔧 Ferramenta de Debug - Módulos Tenant</h3>
        <p><strong>Problema:</strong> A sidebar do tenant não mostra módulos específicos, apenas Home e Insights.</p>
        <p><strong>Organização:</strong> 2da2a9a7-89ec-48bf-a3bc-c46e58d5a9b4 (banban-fashion)</p>
        
        <div className="mt-4">
          <h4 className="font-semibold text-red-700">✅ Como resolver:</h4>
          <ol className="list-decimal pl-5 mt-2">
            <li className="mb-1">Execute o "Executar Debug" para ver o problema</li>
            <li className="mb-1">Se "NENHUM ASSIGNMENT ENCONTRADO", clique "Auto-Atribuir Todos os Módulos"</li>
            <li className="mb-1">Aguarde a conclusão (deve mostrar os módulos atribuídos)</li>
            <li className="mb-1">Volte para <a href="/banban-fashion" className="text-blue-600 underline font-bold">http://localhost:3000/banban-fashion</a></li>
            <li className="mb-1">A sidebar deve agora mostrar os módulos específicos</li>
          </ol>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <h4 className="font-semibold">💡 Explicação Técnica:</h4>
          <p className="text-xs mt-1">A sidebar usa a query: tenant_module_assignments WHERE tenant_id = org_id AND is_active = true</p>
          <p className="text-xs">Se não há registros, não há módulos na sidebar (só mostra fallback: Home, Insights)</p>
        </div>
      </div>
    </div>
  );
}