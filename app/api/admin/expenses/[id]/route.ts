import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';

// PUT - Update an expense
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, role } = await getAuthenticatedUser();

    if (!user || (role !== 'ADMIN' && role !== 'STAFF')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { category_id, supplier_id, amount, description, expense_date } = await request.json();

    // Build update object
    const updates: any = {};
    if (category_id !== undefined) updates.category_id = category_id;
    if (amount !== undefined) {
      const expenseAmount = parseFloat(amount);
      if (isNaN(expenseAmount) || expenseAmount <= 0) {
        return NextResponse.json(
          { error: 'Amount must be a positive number' },
          { status: 400 }
        );
      }
      updates.amount = expenseAmount;
    }
    if (description !== undefined) updates.description = description;
    if (supplier_id !== undefined) {
      if (!supplier_id) {
        return NextResponse.json(
          { error: 'Supplier is required' },
          { status: 400 }
        );
      }

      const { data: supplierData, error: supplierError } = await supabaseAdmin
        .from('suppliers')
        .select('id, active')
        .eq('id', supplier_id)
        .single();

      if (supplierError || !supplierData) {
        return NextResponse.json(
          { error: 'Invalid supplier selected' },
          { status: 400 }
        );
      }

      if (!supplierData.active) {
        return NextResponse.json(
          { error: 'Selected supplier is inactive' },
          { status: 400 }
        );
      }

      updates.supplier_id = supplier_id;
    }
    if (expense_date !== undefined) updates.expense_date = expense_date;

    const { data: updatedExpense, error } = await supabaseAdmin
      .from('expenses')
      .update(updates)
      .eq('id', params.id)
      .select(`
        *,
        expense_categories:category_id (
          id,
          name
        ),
        suppliers:supplier_id (
          id,
          name,
          phone,
          email,
          active
        ),
        users:created_by (
          id,
          name
        )
      `)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!updatedExpense) {
      return NextResponse.json(
        { error: 'Expense not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Delete an expense
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, role } = await getAuthenticatedUser();

    if (!user || role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { error } = await supabaseAdmin
      .from('expenses')
      .delete()
      .eq('id', params.id);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
