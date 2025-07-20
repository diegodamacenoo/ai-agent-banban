import { NextRequest, NextResponse } from 'next/server';
import { 
  generateDeviceFingerprint, 
  isKnownDevice, 
  registerKnownDevice,
  getClientIP,
  getUserAgent
} from '@/shared/utils/security-detector';

export async function GET(request: NextRequest) {
  try {
    // Simular um usuário teste (substitua pelo ID do usuário real nos testes)
    const testUserId = 'd5edd63c-1497-4925-a649-d348440d142b'; // ID do usuário que tem configuração de segurança
    
    const deviceFingerprint = await generateDeviceFingerprint();
    const userAgent = await getUserAgent();
    const ipAddress = await getClientIP();
    
    // Verificar se é um dispositivo conhecido
    const isKnown = await isKnownDevice(testUserId, deviceFingerprint);
    
    // Registrar o dispositivo
    const registered = await registerKnownDevice(testUserId, deviceFingerprint, userAgent || undefined);
    
    return NextResponse.json({
      success: true,
      data: {
        device_fingerprint: deviceFingerprint,
        user_agent: userAgent,
        ip_address: ipAddress,
        is_known_device: isKnown,
        registration_success: registered,
        test_user_id: testUserId
      }
    });
  } catch (error) {
    console.error('Erro no teste de dispositivo:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', details: error },
      { status: 500 }
    );
  }
} 
