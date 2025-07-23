import { NextRequest, NextResponse } from 'next/server';
import { checkMaintenanceMode } from '@/app/actions/admin/modules/system-config-utils';

export async function GET(request: NextRequest) {
  try {
    const status = await checkMaintenanceMode();
    
    return NextResponse.json(status);
  } catch (error) {
    console.error('Erro ao verificar status de manutenção:', error);
    
    return NextResponse.json(
      { inMaintenance: false },
      { status: 500 }
    );
  }
}