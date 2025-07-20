import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/core/supabase/server';

type RouteContext = {
  params: Promise<{ token: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
): Promise<NextResponse> {
  try {
    const { token } = await params;
    const supabase = await createSupabaseServerClient();

    // Verificar se o token é válido
    const { data: exportRequest, error: exportError } = await supabase
      .from('data_exports')
      .select('*')
      .eq('token', token)
      .single();

    if (exportError || !exportRequest) {
      return NextResponse.json(
        { error: 'Token de download inválido ou expirado' },
        { status: 400 }
      );
    }

    // Verificar se o arquivo ainda existe
    const { data: fileData, error: fileError } = await supabase.storage
      .from('data-exports')
      .download(exportRequest.file_path);

    if (fileError || !fileData) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      );
    }

    // Retornar o arquivo para download
    const headers = new Headers();
    headers.set('Content-Type', 'application/octet-stream');
    headers.set(
      'Content-Disposition',
      `attachment; filename=${exportRequest.file_name}`
    );

    return new NextResponse(fileData, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Erro ao processar download:', error);
    return NextResponse.json(
      { error: 'Erro ao processar o download' },
      { status: 500 }
    );
  }
}
