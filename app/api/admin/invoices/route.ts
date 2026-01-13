import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth-server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Generate invoice number
function generateInvoiceNumber(invoiceType: string = 'INVOICE'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const prefix = invoiceType === 'PROFORMA' ? 'PRO' : 'INV';
  const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `${prefix}-${year}-${month}${day}-${random}`;
}

// POST - Create invoice manually (Admin/Staff)
export async function POST(request: NextRequest) {
  try {
    // Check authentication and role
    const { user, role } = await getAuthenticatedUser(request);
    
    if (!user || (role !== 'ADMIN' && role !== 'STAFF')) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin or Staff access required.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      business_id,
      start_date,
      end_date,
      invoice_type = 'INVOICE',
      due_date,
      notes,
    } = body;

    // Validation
    if (!business_id || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'Business ID, start date, and end date are required' },
        { status: 400 }
      );
    }

    // Verify business exists
    const { data: business, error: businessError } = await supabaseAdmin
      .from('businesses')
      .select('id, name')
      .eq('id', business_id)
      .single();

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      );
    }

    // Get charges in date range
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    endDate.setHours(23, 59, 59, 999); // Include entire end date

    const { data: charges, error: chargesError } = await supabaseAdmin
      .from('charges')
      .select('*')
      .eq('business_id', business_id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (chargesError) {
      return NextResponse.json(
        { error: `Failed to fetch charges: ${chargesError.message}` },
        { status: 500 }
      );
    }

    if (!charges || charges.length === 0) {
      return NextResponse.json(
        { error: 'No charges found in the selected date range' },
        { status: 400 }
      );
    }

    // Calculate total
    const totalAmount = charges.reduce((sum, charge) => {
      return sum + parseFloat(charge.amount.toString());
    }, 0);

    // Generate invoice number
    let invoiceNumber = generateInvoiceNumber(invoice_type);
    
    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 10) {
      const { data: existing } = await supabaseAdmin
        .from('invoices')
        .select('id')
        .eq('invoice_number', invoiceNumber)
        .single();

      if (!existing) break;
      
      invoiceNumber = generateInvoiceNumber(invoice_type);
      attempts++;
    }

    // Determine status based on invoice type
    const status = invoice_type === 'PROFORMA' ? 'PROFORMA' : 'DRAFT';

    // Create invoice
    const invoiceData = {
      business_id,
      week_start: start_date,
      week_end: end_date,
      invoice_number: invoiceNumber,
      total_amount: totalAmount,
      status,
      invoice_type: invoice_type,
      due_date: due_date || null,
      notes: notes || null,
      created_by: user.id,
    };
    const { data: invoice, error: invoiceError } = await supabaseAdmin
      .from('invoices')
      .insert(invoiceData)
      .select()
      .single();

    if (invoiceError) {
      return NextResponse.json(
        { error: `Failed to create invoice: ${invoiceError.message}` },
        { status: 500 }
      );
    }

    // Create invoice items from charges
    const invoiceItems = charges.map((charge) => ({
      invoice_id: invoice.id,
      delivery_id: charge.delivery_id,
      amount: charge.amount,
      description: charge.description || `Delivery charge`,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('invoice_items')
      .insert(invoiceItems);

    if (itemsError) {
      // Rollback: delete invoice if items creation fails
      await supabaseAdmin.from('invoices').delete().eq('id', invoice.id);
      return NextResponse.json(
        { error: `Failed to create invoice items: ${itemsError.message}` },
        { status: 500 }
      );
    }

    // Fetch complete invoice with items
    const { data: completeInvoice, error: fetchError } = await supabaseAdmin
      .from('invoices')
      .select(`
        *,
        invoice_items (*)
      `)
      .eq('id', invoice.id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: `Failed to fetch invoice: ${fetchError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(completeInvoice);
  } catch (error) {
    console.error('Invoice creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
