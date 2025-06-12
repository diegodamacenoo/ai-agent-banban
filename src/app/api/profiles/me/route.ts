import { NextResponse } from 'next/server';
import { getProfile } from '@/app/actions/profiles/user-profile';
import { createLogger } from '@/lib/utils/logger';
import { DEBUG_MODULES } from '@/lib/utils/debug-config';

// Criar logger para a API de perfis
const logger = createLogger(DEBUG_MODULES.API_PROFILES);

export async function GET() {
  const result = await getProfile();
  
  // Log usando o novo sistema
  logger.debug('API /api/profiles/me response:', result);
  
  if (result.error) {
    logger.error('API /api/profiles/me error:', result.error);
    return NextResponse.json({ error: result.error }, { status: 401 });
  }
  return NextResponse.json({ data: result.data });
}
