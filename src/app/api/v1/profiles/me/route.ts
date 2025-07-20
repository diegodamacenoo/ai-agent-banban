import { NextResponse } from 'next/server';
import { getProfile } from '@/app/actions/profiles/user-profile';
import { createLogger } from '@/shared/utils/logger';
import { DEBUG_MODULES } from '@/shared/utils/debug-config';
import { withRateLimit } from '@/core/api/rate-limiter';
import { headers } from 'next/headers';

// Criar logger para a API de perfis
const logger = createLogger(DEBUG_MODULES.API);

export async function GET() {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for');
    const { success, headers: rateHeaders } = await withRateLimit('standard', 'profile-me-api');
    if (!success) {
      return NextResponse.json({ error: "Too many requests" }, { 
        status: 429,
        headers: rateHeaders
      });
    }

    const result = await getProfile();
    
    // Log usando o novo sistema
    logger.debug('API /api/profiles/me response:', result);
    
    if (result.error) {
      logger.error('API /api/profiles/me error:', result.error);
      return NextResponse.json({ error: result.error }, { status: 401 });
    }
    return NextResponse.json({ data: result.data });
  } catch (error: any) {
    logger.error('Unexpected error in /api/profiles/me:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
