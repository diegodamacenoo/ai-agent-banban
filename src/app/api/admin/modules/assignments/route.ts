import { NextRequest, NextResponse } from 'next/server';
import { getTenantAssignments } from '@/app/actions/admin/modules/tenant-module-assignments';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const filters = {
      tenant_id: searchParams.get('tenant_id') || undefined,
      base_module_id: searchParams.get('base_module_id') || undefined,
      implementation_id: searchParams.get('implementation_id') || undefined,
      includeArchived: searchParams.get('includeArchived') === 'true',
      includeDeleted: searchParams.get('includeDeleted') === 'true',
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
    };

    const result = await getTenantAssignments(filters);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}