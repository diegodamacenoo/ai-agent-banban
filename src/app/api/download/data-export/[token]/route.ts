import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * GET /api/download/data-export/[token]
 * 
 * @description Endpoint para download seguro de arquivos de exportação de dados.
 * Utiliza tokens únicos e tem controle de número máximo de downloads.
 * 
 * @param {string} token - Token único de download
 * @returns {Response} Arquivo ou erro
 * 
 * @security Token único com expiração, rate limiting por usuário
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token de download obrigatório' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createSupabaseClient(cookieStore);
    
    // Verificar autenticação
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Buscar exportação pelo token
    const { data: exportData, error: exportError } = await supabase
      .from('user_data_exports')
      .select('*')
      .eq('download_token', token)
      .eq('user_id', user.id) // Garantir que o usuário só acesse seus próprios arquivos
      .single();

    if (exportError || !exportData) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado ou token inválido' },
        { status: 404 }
      );
    }

    // Verificar se exportação está completa
    if (exportData.status !== 'completed') {
      return NextResponse.json(
        { error: 'Exportação ainda não está pronta para download' },
        { status: 400 }
      );
    }

    // Verificar se não expirou
    if (new Date() > new Date(exportData.expires_at)) {
      return NextResponse.json(
        { error: 'Arquivo expirado' },
        { status: 410 }
      );
    }

    // Verificar limite de downloads
    if (exportData.download_count >= exportData.max_downloads) {
      return NextResponse.json(
        { error: 'Limite máximo de downloads atingido' },
        { status: 410 }
      );
    }

    try {
      // Buscar arquivo no Supabase Storage
      const fileName = `${user.id}/${exportData.id}.${exportData.format}`;
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('data-exports')
        .download(fileName);

      if (downloadError || !fileData) {
        console.error('Erro ao baixar arquivo do storage:', downloadError);
        return NextResponse.json(
          { error: 'Erro ao acessar arquivo' },
          { status: 500 }
        );
      }

      // Incrementar contador de downloads
      await supabase
        .from('user_data_exports')
        .update({
          download_count: exportData.download_count + 1,
          downloaded_at: new Date().toISOString()
        })
        .eq('id', exportData.id);

      // Registrar auditoria do download
      await supabase
        .from('audit_logs')
        .insert({
          actor_user_id: user.id,
          action_type: 'data_export_downloaded',
          resource_type: 'user_data',
          resource_id: user.id,
          details: {
            export_id: exportData.id,
            format: exportData.format,
            download_count: exportData.download_count + 1,
            file_size_bytes: exportData.file_size_bytes,
            ip_address: request.headers.get('x-forwarded-for') || 
                       request.headers.get('x-real-ip') || 
                       'unknown'
          }
        });

      // Preparar resposta com o arquivo
      const arrayBuffer = await fileData.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Definir content-type baseado no formato
      const contentType = getContentType(exportData.format);
      const fileName_download = `dados-pessoais-${exportData.created_at.split('T')[0]}.${exportData.format}`;

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${fileName_download}"`,
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

    } catch (downloadError) {
      console.error('Erro durante download:', downloadError);
      return NextResponse.json(
        { error: 'Erro interno durante download' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Erro crítico na API de download:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

/**
 * Determina o content-type baseado no formato
 */
function getContentType(format: string): string {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'csv':
      return 'text/csv';
    case 'pdf':
      return 'application/pdf';
    default:
      return 'application/octet-stream';
  }
} 