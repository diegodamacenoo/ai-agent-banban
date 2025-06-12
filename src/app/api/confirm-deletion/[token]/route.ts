import { NextRequest, NextResponse } from 'next/server';
import { confirmAccountDeletion } from '@/app/actions/auth/account-management';

/**
 * GET /api/confirm-deletion/[token]
 * 
 * @description Endpoint público para confirmação de exclusão de conta via email.
 * Redireciona para a página de confirmação com resultado da operação.
 * 
 * @param {string} token - Token de verificação do email
 * @returns {Response} Redirecionamento com resultado
 * 
 * @security Token único com expiração de 24h
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.redirect(
        new URL('/settings?error=Token de confirmação inválido', request.url)
      );
    }

    // Chamar Server Action para confirmar exclusão
    const result = await confirmAccountDeletion(token);

    if (result.success) {
      // Redirecionar para página de sucesso
      const successMessage = encodeURIComponent(result.data?.message || 'Exclusão confirmada com sucesso.');
      return NextResponse.redirect(
        new URL(`/settings?success=${successMessage}&confirmed=true`, request.url)
      );
    } else {
      // Redirecionar para página de erro
      const errorMessage = encodeURIComponent(result.error || 'Erro ao confirmar exclusão.');
      return NextResponse.redirect(
        new URL(`/settings?error=${errorMessage}`, request.url)
      );
    }

  } catch (error: any) {
    console.error('Erro inesperado na confirmação de exclusão:', error);
    const errorMessage = encodeURIComponent('Erro interno. Tente novamente.');
    return NextResponse.redirect(
      new URL(`/settings?error=${errorMessage}`, request.url)
    );
  }
} 