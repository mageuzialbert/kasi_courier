import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';
import { requirePermission } from '@/lib/permissions-server';

function buildPlaceholderEmail(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');

  return `${slug || 'supplier'}@placeholder.local`;
}

// GET - List suppliers
export async function GET(request: NextRequest) {
  try {
    const { user, role } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { allowed, error: permError } = await requirePermission(user.id, role || '', 'expenses.view');
    if (!allowed) {
      return NextResponse.json(
        { error: permError || 'Permission denied' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const active = searchParams.get('active');

    let query = supabaseAdmin
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (active === 'true') {
      query = query.eq('active', true);
    } else if (active === 'false') {
      query = query.eq('active', false);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create supplier
export async function POST(request: NextRequest) {
  try {
    const { user, role } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { allowed, error: permError } = await requirePermission(user.id, role || '', 'expenses.create');
    if (!allowed) {
      return NextResponse.json(
        { error: permError || 'Permission denied' },
        { status: 403 }
      );
    }

    const { name, phone, email, active } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const supplierPhone = typeof phone === 'string' && phone.trim()
      ? phone.trim()
      : '+255000000000';
    const supplierEmail = typeof email === 'string' && email.trim()
      ? email.trim()
      : buildPlaceholderEmail(trimmedName);

    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .insert({
        name: trimmedName,
        phone: supplierPhone,
        email: supplierEmail,
        active: active !== undefined ? !!active : true,
      })
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Supplier name already exists' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
