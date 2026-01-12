import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(request: NextRequest) {
  try {
    const {
      businessId,
      userId,
      pickup_address,
      pickup_name,
      pickup_phone,
      pickup_region_id,
      pickup_district_id,
      dropoff_address,
      dropoff_name,
      dropoff_phone,
      dropoff_region_id,
      dropoff_district_id,
      package_description,
    } = await request.json();

    // Validation
    if (!businessId || !userId) {
      return NextResponse.json(
        { error: 'Business ID and User ID are required' },
        { status: 400 }
      );
    }

    if (!pickup_address || !pickup_name || !pickup_phone || !dropoff_address || !dropoff_name || !dropoff_phone) {
      return NextResponse.json(
        { error: 'All delivery fields are required' },
        { status: 400 }
      );
    }

    // Create delivery
    const { data: deliveryData, error: deliveryError } = await supabaseAdmin
      .from('deliveries')
      .insert({
        business_id: businessId,
        pickup_address,
        pickup_name,
        pickup_phone,
        pickup_region_id: pickup_region_id || null,
        pickup_district_id: pickup_district_id || null,
        dropoff_address,
        dropoff_name,
        dropoff_phone,
        dropoff_region_id: dropoff_region_id || null,
        dropoff_district_id: dropoff_district_id || null,
        package_description: package_description || null,
        status: 'CREATED',
        created_by: userId,
      })
      .select('id')
      .single();

    if (deliveryError) {
      return NextResponse.json(
        { error: deliveryError.message },
        { status: 500 }
      );
    }

    // Create delivery event
    await supabaseAdmin
      .from('delivery_events')
      .insert({
        delivery_id: deliveryData.id,
        status: 'CREATED',
        note: 'Delivery created via quick order',
        created_by: userId,
      });

    return NextResponse.json({
      success: true,
      deliveryId: deliveryData.id,
      message: 'Delivery created successfully',
    });
  } catch (error) {
    console.error('Error creating quick order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
