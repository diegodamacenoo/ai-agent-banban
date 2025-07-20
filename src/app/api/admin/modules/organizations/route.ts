import { NextResponse } from 'next/server';
import { getAllModulesWithOrganizationAssignments } from '@/app/actions/admin/modules/module-organization-data';

export async function GET() {
  try {
    const result = await getAllModulesWithOrganizationAssignments();
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(result.data);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}