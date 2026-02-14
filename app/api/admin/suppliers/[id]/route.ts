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

// GET - Supplier details with expense summary
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from('suppliers')
      .select('id, name, phone, email, active')
      .eq('id', params.id)
      .single();

    if (supplierError || !supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('amount')
      .eq('supplier_id', params.id);

    if (expensesError) {
      return NextResponse.json(
        { error: expensesError.message },
        { status: 500 }
      );
    }

    const totalExpense = (expenses || []).reduce((sum, exp) => {
      return sum + parseFloat((exp.amount ?? 0).toString());
    }, 0);

    return NextResponse.json({
      ...supplier,
      totalExpense,
      expenseCount: expenses?.length || 0,
    });
  } catch (error) {
    console.error('Error fetching supplier details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, role } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { allowed, error: permError } = await requirePermission(user.id, role || '', 'expenses.update');
    if (!allowed) {
      return NextResponse.json(
        { error: permError || 'Permission denied' },
        { status: 403 }
      );
    }

    const { name, phone, email, active } = await request.json();

    const updates: Record<string, any> = {};

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (!trimmedName) {
        return NextResponse.json(
          { error: 'Supplier name cannot be empty' },
          { status: 400 }
        );
      }
      updates.name = trimmedName;
    }

    if (phone !== undefined) {
      const trimmedPhone = typeof phone === 'string' ? phone.trim() : '';
      updates.phone = trimmedPhone || '+255000000000';
    }

    if (email !== undefined) {
      const trimmedEmail = typeof email === 'string' ? email.trim() : '';
      if (trimmedEmail) {
        updates.email = trimmedEmail;
      } else if (updates.name) {
        updates.email = buildPlaceholderEmail(updates.name);
      }
    }

    if (active !== undefined) {
      updates.active = !!active;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('suppliers')
      .update(updates)
      .eq('id', params.id)
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

    if (!data) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete supplier (or deactivate if in use)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, role } = await getAuthenticatedUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { allowed, error: permError } = await requirePermission(user.id, role || '', 'expenses.delete');
    if (!allowed) {
      return NextResponse.json(
        { error: permError || 'Permission denied' },
        { status: 403 }
      );
    }

    const { data: expensesUsingSupplier } = await supabaseAdmin
      .from('expenses')
      .select('id')
      .eq('supplier_id', params.id)
      .limit(1);

    if (expensesUsingSupplier && expensesUsingSupplier.length > 0) {
      const { data, error } = await supabaseAdmin
        .from('suppliers')
        .update({ active: false })
        .eq('id', params.id)
        .select('*')
        .single();

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Supplier deactivated (in use by expenses)',
        supplier: data,
      });
    }

    const { error } = await supabaseAdmin
      .from('suppliers')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
