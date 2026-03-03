import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// GET - List all riders (users with role RIDER)
export async function GET(request: NextRequest) {
  try {
    const { user, role } = await getAuthenticatedUser();

    if (!user || (role !== 'ADMIN' && role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const active = searchParams.get('active');

    let query = supabaseAdmin
      .from('users')
      .select('id, name, phone, active, created_at')
      .eq('role', 'RIDER')
      .order('name', { ascending: true });

    if (active === 'true') {
      query = query.eq('active', true);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching riders:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
