import { NextRequest, NextResponse } from 'next/server';
import { getModuleImplementations } from '@/app/actions/admin/modules/module-implementations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      base_module_id: searchParams.get('base_module_id') || undefined,
      search: searchParams.get('search') || undefined,
      audience: searchParams.get('audience') as any || undefined,
      complexity: searchParams.get('complexity') as any || undefined,
      includeArchived: searchParams.get('includeArchived') === 'true',
      includeDeleted: searchParams.get('includeDeleted') === 'true',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    const result = await getModuleImplementations(filters);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}