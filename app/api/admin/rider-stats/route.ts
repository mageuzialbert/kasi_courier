import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';

// GET - Rider KPI stats for a given date range
// Query params: start (YYYY-MM-DD), end (YYYY-MM-DD)
export async function GET(request: NextRequest) {
  try {
    const { user, role } = await getAuthenticatedUser();

    if (!user || (role !== 'ADMIN' && role !== 'STAFF')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');

    // 1. Fetch all RIDER users
    const { data: riders, error: ridersError } = await supabaseAdmin
      .from('users')
      .select('id, name, phone, active')
      .eq('role', 'RIDER')
      .order('name', { ascending: true });

    if (ridersError) {
      return NextResponse.json({ error: ridersError.message }, { status: 500 });
    }

    if (!riders || riders.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Fetch deliveries in time range
    let deliveriesQuery = supabaseAdmin
      .from('deliveries')
      .select('id, assigned_rider_id, status, created_at, delivered_at, business_id')
      .not('assigned_rider_id', 'is', null);

    if (startDate) {
      deliveriesQuery = deliveriesQuery.gte('created_at', `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      deliveriesQuery = deliveriesQuery.lte('created_at', `${endDate}T23:59:59.999Z`);
    }

    const { data: deliveries, error: deliveriesError } = await deliveriesQuery;

    if (deliveriesError) {
      return NextResponse.json({ error: deliveriesError.message }, { status: 500 });
    }

    // 3. Fetch charges for the deliveries (revenue)
    // Batch the .in() query to avoid URL length limits with large delivery sets
    const deliveryIds = (deliveries || []).map((d) => d.id);
    let charges: { delivery_id: string; amount: number }[] = [];

    if (deliveryIds.length > 0) {
      const BATCH_SIZE = 50;
      for (let i = 0; i < deliveryIds.length; i += BATCH_SIZE) {
        const batch = deliveryIds.slice(i, i + BATCH_SIZE);
        const { data: chargesData, error: chargesError } = await supabaseAdmin
          .from('charges')
          .select('delivery_id, amount')
          .in('delivery_id', batch);

        if (!chargesError && chargesData) {
          charges = charges.concat(chargesData);
        }
      }
    }

    // 4. Fetch salary expenses for riders in time range
    let expensesQuery = supabaseAdmin
      .from('expenses')
      .select('rider_id, staff_id, amount, expense_date, is_salary')
      .eq('is_salary', true)
      .not('rider_id', 'is', null);

    if (startDate) {
      expensesQuery = expensesQuery.gte('expense_date', startDate);
    }
    if (endDate) {
      expensesQuery = expensesQuery.lte('expense_date', endDate);
    }

    const { data: salaryExpenses, error: salaryExpensesError } = await expensesQuery;

    if (salaryExpensesError) {
      return NextResponse.json({ error: salaryExpensesError.message }, { status: 500 });
    }

    // 5. Build per-rider stats
    const riderStats = riders.map((rider) => {
      const riderDeliveries = (deliveries || []).filter(
        (d) => d.assigned_rider_id === rider.id
      );

      const deliveryCount = riderDeliveries.length;
      const deliveredCount = riderDeliveries.filter(
        (d) => d.status === 'DELIVERED'
      ).length;
      const failedCount = riderDeliveries.filter(
        (d) => d.status === 'FAILED' || d.status === 'REJECTED'
      ).length;
      const inProgressCount = riderDeliveries.filter(
        (d) => !['DELIVERED', 'FAILED', 'REJECTED'].includes(d.status)
      ).length;

      const successRate =
        deliveryCount > 0
          ? Math.round((deliveredCount / deliveryCount) * 100)
          : 0;

      const failedRate =
        deliveryCount > 0
          ? Math.round((failedCount / deliveryCount) * 100)
          : 0;

      // Revenue: sum of charges for this rider's deliveries
      const riderDeliveryIds = new Set(riderDeliveries.map((d) => d.id));
      const revenue = charges
        .filter((c) => riderDeliveryIds.has(c.delivery_id))
        .reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0);

      // Salary burn
      const salaryBurn = (salaryExpenses || [])
        .filter((e) => e.rider_id === rider.id)
        .reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

      const net = revenue - salaryBurn;

      // Active days: distinct calendar days with at least one delivery
      const activeDaysSet = new Set(
        riderDeliveries.map((d) =>
          new Date(d.created_at).toISOString().split('T')[0]
        )
      );
      const activeDays = activeDaysSet.size;
      const avgDeliveriesPerDay =
        activeDays > 0
          ? Math.round((deliveryCount / activeDays) * 10) / 10
          : 0;

      return {
        id: rider.id,
        name: rider.name,
        phone: rider.phone,
        active: rider.active,
        deliveryCount,
        deliveredCount,
        failedCount,
        inProgressCount,
        successRate,
        failedRate,
        revenue,
        salaryBurn,
        net,
        activeDays,
        avgDeliveriesPerDay,
      };
    });

    // 6. Summary totals
    const summary = {
      totalDeliveries: riderStats.reduce((s, r) => s + r.deliveryCount, 0),
      totalDelivered: riderStats.reduce((s, r) => s + r.deliveredCount, 0),
      totalRevenue: riderStats.reduce((s, r) => s + r.revenue, 0),
      totalSalaryBurn: riderStats.reduce((s, r) => s + r.salaryBurn, 0),
      totalNet: riderStats.reduce((s, r) => s + r.net, 0),
    };

    return NextResponse.json({ summary, riders: riderStats });
  } catch (error) {
    console.error('Error fetching rider stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
