'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/core/supabase/client';

export default function TestTokenPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testToken = async () => {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    
    // Pegar o token_hash da URL
    const urlParams = new URLSearchParams(window.location.search);
    const tokenHash = urlParams.get('token_hash');
    const type = urlParams.get('type');
    
    console.debug('🧪 TESTANDO TOKEN:');
    console.debug('  - tokenHash:', tokenHash);
    console.debug('  - type:', type);
    
    if (tokenHash && type) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        });
        
        console.debug('📝 RESULTADO:', { data, error });
        setResult({ data, error });
      } catch (err) {
        console.error('❌ ERRO:', err);
        setResult({ error: err });
      }
    } else {
      setResult({ error: 'Token ou type não encontrado na URL' });
    }
    
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Token Page</h1>
      
      <button 
        onClick={testToken}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        {loading ? 'Testando...' : 'Testar Token'}
      </button>
      
      {result && (
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Resultado:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}