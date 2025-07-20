import { NextRequest, NextResponse } from 'next/server';
import { performModuleScan } from '@/app/actions/admin/scan-modules';

export async function POST(request: NextRequest) {
  try {
    console.debug('🔍 API Scanner: Iniciando escaneamento via API...');
    
    // Executar scanner real
    const result = await performModuleScan();
    
    console.debug('✅ API Scanner: Escaneamento concluído:', result);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Escaneamento concluído com sucesso'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Erro durante escaneamento'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ API Scanner: Erro na API:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    }, { status: 500 });
  }
}