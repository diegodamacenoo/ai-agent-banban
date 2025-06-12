import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { 
  isKnownDevice, 
  registerKnownDevice,
  triggerSecurityAlert,
  getClientIP,
  getUserAgent
} from '@/lib/utils/security-detector';

export async function POST(request: NextRequest) {
  try {
    const { user_id, user_email, device_fingerprint } = await request.json();
    
    if (!user_id || !user_email || !device_fingerprint) {
      return NextResponse.json(
        { error: 'user_id, user_email e device_fingerprint são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Verificar se é um dispositivo conhecido
    const isKnown = await isKnownDevice(user_id, device_fingerprint);
    
    if (!isKnown) {
      // Dispositivo novo - registrar como conhecido
      const userAgent = request.headers.get('user-agent');
      await registerKnownDevice(user_id, device_fingerprint, userAgent || undefined);
      
      // Disparar alerta de novo dispositivo
      const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                       request.headers.get('x-real-ip') ||
                       request.headers.get('x-client-ip') ||
                       null;
      
      await triggerSecurityAlert({
        type: 'new_device',
        user_id,
        user_email,
        ip_address: ipAddress || undefined,
        user_agent: userAgent || undefined,
        device_fingerprint
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Novo dispositivo detectado e registrado',
        is_new_device: true
      });
    } else {
      // Dispositivo conhecido - apenas atualizar last_seen_at
      const userAgent = request.headers.get('user-agent');
      await registerKnownDevice(user_id, device_fingerprint, userAgent || undefined);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Dispositivo conhecido',
        is_new_device: false
      });
    }
  } catch (error) {
    console.error('Erro ao processar verificação de dispositivo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 