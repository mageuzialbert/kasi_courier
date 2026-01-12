import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';

// PUT - Assign rider to delivery
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

    // Check if user is STAFF or ADMIN
    if (role !== 'STAFF' && role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { rider_id } = await request.json();

    if (!rider_id) {
      return NextResponse.json(
        { error: 'Rider ID is required' },
        { status: 400 }
      );
    }

    // Verify rider exists and is a RIDER
    const { data: rider, error: riderError } = await supabaseAdmin
      .from('users')
      .select('id, role, active')
      .eq('id', rider_id)
      .single();

    if (riderError || !rider) {
      return NextResponse.json(
        { error: 'Rider not found' },
        { status: 404 }
      );
    }

    if (rider.role !== 'RIDER') {
      return NextResponse.json(
        { error: 'User is not a rider' },
        { status: 400 }
      );
    }

    if (!rider.active) {
      return NextResponse.json(
        { error: 'Rider is not active' },
        { status: 400 }
      );
    }

    // Verify delivery exists
    const { data: delivery, error: deliveryError } = await supabaseAdmin
      .from('deliveries')
      .select('id, status, assigned_rider_id')
      .eq('id', params.id)
      .single();

    if (deliveryError || !delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      );
    }

    // Update delivery
    const { data: updatedDelivery, error: updateError } = await supabaseAdmin
      .from('deliveries')
      .update({
        assigned_rider_id: rider_id,
        status: 'ASSIGNED',
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Create delivery event
    await supabaseAdmin
      .from('delivery_events')
      .insert({
        delivery_id: params.id,
        status: 'ASSIGNED',
        note: `Assigned to rider ${rider.name || rider_id}`,
        created_by: user.id,
      });

    // TODO: Send SMS notification to rider (use lib/sms.ts)

    return NextResponse.json({
      success: true,
      delivery: updatedDelivery,
    });
  } catch (error) {
    console.error('Error assigning rider:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
