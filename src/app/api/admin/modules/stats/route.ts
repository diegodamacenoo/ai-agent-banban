import { NextResponse } from 'next/server';
import { getBaseModuleStats } from '@/app/actions/admin/modules/base-modules';

export async function GET() {
  try {
    const result = await getBaseModuleStats();
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('API Stats Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}