import { NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';

export async function GET() {
  try {
    const { user, role } = await getAuthenticatedUser();

    if (!user || role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [
      staffResult,
      ridersResult,
      clientsResult,
      deliveriesResult,
      suppliersResult,
    ] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'STAFF'),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'RIDER'),
      supabaseAdmin.from('businesses').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('deliveries').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('suppliers').select('*', { count: 'exact', head: true }),
    ]);

    const errors = [
      staffResult.error,
      ridersResult.error,
      clientsResult.error,
      deliveriesResult.error,
      suppliersResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      const firstError = errors[0];
      return NextResponse.json(
        { error: firstError?.message || 'Failed to load dashboard overview' },
        { status: 500 }
      );
    }

    const totalStaff = staffResult.count || 0;
    const totalRiders = ridersResult.count || 0;

    return NextResponse.json({
      totalUsers: totalStaff + totalRiders,
      totalStaff,
      totalRiders,
      totalClients: clientsResult.count || 0,
      totalDeliveries: deliveriesResult.count || 0,
      totalSuppliers: suppliersResult.count || 0,
    });
  } catch (error) {
    console.error('Error fetching admin dashboard overview:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
