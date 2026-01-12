import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';

// GET - Financial analytics data
export async function GET(request: NextRequest) {
  try {
    const { user, role } = await getAuthenticatedUser();

    if (!user || (role !== 'STAFF' && role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Calculate date ranges
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get total revenue from charges
    const { data: allCharges } = await supabaseAdmin
      .from('charges')
      .select('amount');

    const totalRevenue = allCharges?.reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0) || 0;

    // Get this week's revenue
    const { data: weekCharges } = await supabaseAdmin
      .from('charges')
      .select('amount')
      .gte('created_at', weekStart.toISOString());

    const weekRevenue = weekCharges?.reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0) || 0;

    // Get this month's revenue
    const { data: monthCharges } = await supabaseAdmin
      .from('charges')
      .select('amount')
      .gte('created_at', monthStart.toISOString());

    const monthRevenue = monthCharges?.reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0) || 0;

    // Get invoices overview
    const { data: invoices } = await supabaseAdmin
      .from('invoices')
      .select('id, status, total_amount, generated_at');

    const invoicesOverview = {
      total: invoices?.length || 0,
      pending: invoices?.filter((i) => i.status === 'SENT').length || 0,
      paid: invoices?.filter((i) => i.status === 'PAID').length || 0,
      draft: invoices?.filter((i) => i.status === 'DRAFT').length || 0,
      totalAmount: invoices?.reduce((sum, i) => sum + parseFloat(i.total_amount.toString()), 0) || 0,
      pendingAmount: invoices?.filter((i) => i.status === 'SENT').reduce((sum, i) => sum + parseFloat(i.total_amount.toString()), 0) || 0,
    };

    // Get charges breakdown (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: recentCharges } = await supabaseAdmin
      .from('charges')
      .select(`
        id,
        amount,
        description,
        created_at,
        businesses:business_id (
          id,
          name
        )
      `)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    // Get top businesses by revenue
    const { data: businessCharges } = await supabaseAdmin
      .from('charges')
      .select(`
        business_id,
        amount,
        businesses:business_id (
          id,
          name
        )
      `);

    const businessRevenue: Record<string, { businessId: string; businessName: string; revenue: number }> = {};
    businessCharges?.forEach((charge) => {
      const businessId = charge.business_id;
      const business = charge.businesses as any;
      if (!businessRevenue[businessId]) {
        businessRevenue[businessId] = {
          businessId,
          businessName: business?.name || 'Unknown',
          revenue: 0,
        };
      }
      businessRevenue[businessId].revenue += parseFloat(charge.amount.toString());
    });

    const topBusinesses = Object.values(businessRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Get revenue trends (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: trendCharges } = await supabaseAdmin
      .from('charges')
      .select('amount, created_at')
      .gte('created_at', sevenDaysAgo.toISOString());

    const dailyRevenue: Record<string, number> = {};
    trendCharges?.forEach((charge) => {
      const date = new Date(charge.created_at).toISOString().split('T')[0];
      dailyRevenue[date] = (dailyRevenue[date] || 0) + parseFloat(charge.amount.toString());
    });

    const revenueTrends = Object.entries(dailyRevenue)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      revenue: {
        total: totalRevenue,
        thisWeek: weekRevenue,
        thisMonth: monthRevenue,
      },
      invoices: invoicesOverview,
      chargesBreakdown: recentCharges || [],
      topBusinesses,
      revenueTrends,
    });
  } catch (error) {
    console.error('Error fetching financial data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
