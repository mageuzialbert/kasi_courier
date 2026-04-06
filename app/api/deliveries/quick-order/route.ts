import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendEventNotification } from '@/lib/notifications';
import { calculateDistanceKm } from '@/lib/distance';

const COMPANY_PROFILE_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: NextRequest) {
  try {
    const {
      businessId,
      userId,
      pickup_address,
      pickup_latitude,
      pickup_longitude,
      pickup_name,
      pickup_phone,
      pickup_region_id,
      pickup_district_id,
      dropoff_address,
      dropoff_latitude,
      dropoff_longitude,
      dropoff_name,
      dropoff_phone,
      dropoff_region_id,
      dropoff_district_id,
      package_description,
      attachment_url,
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

    // Fetch global price_per_km from company profile
    let pricePerKm = 2000; // default fallback
    const { data: companyData } = await supabaseAdmin
      .from('company_profile')
      .select('price_per_km')
      .eq('id', COMPANY_PROFILE_ID)
      .single();
    if (companyData?.price_per_km) {
      pricePerKm = parseFloat(companyData.price_per_km.toString());
    }

    // Calculate distance from coordinates
    let distanceKm: number | null = null;
    if (pickup_latitude && pickup_longitude && dropoff_latitude && dropoff_longitude) {
      distanceKm = calculateDistanceKm(
        parseFloat(pickup_latitude.toString()),
        parseFloat(pickup_longitude.toString()),
        parseFloat(dropoff_latitude.toString()),
        parseFloat(dropoff_longitude.toString()),
      );
    }

    // Calculate per-km price
    const kmPrice = distanceKm != null ? Math.round((distanceKm * pricePerKm) / 500) * 500 : 0;

    // Determine pricing: check if business has custom fee
    let pricingMethod: string;
    let priceApplied: number;

    if (businessId) {
      const { data: business } = await supabaseAdmin
        .from('businesses')
        .select('id, delivery_fee')
        .eq('id', businessId)
        .single();

      if (business?.delivery_fee) {
        pricingMethod = 'CUSTOM_CLIENT';
        priceApplied = parseFloat(business.delivery_fee.toString());
      } else {
        pricingMethod = 'PER_KM';
        priceApplied = kmPrice;
      }
    } else {
      pricingMethod = 'PER_KM';
      priceApplied = kmPrice;
    }

    // Create delivery
    const { data: deliveryData, error: deliveryError } = await supabaseAdmin
      .from('deliveries')
      .insert({
        business_id: businessId,
        pickup_address,
        pickup_latitude: pickup_latitude || null,
        pickup_longitude: pickup_longitude || null,
        pickup_name,
        pickup_phone,
        pickup_region_id: pickup_region_id || null,
        pickup_district_id: pickup_district_id || null,
        dropoff_address,
        dropoff_latitude: dropoff_latitude || null,
        dropoff_longitude: dropoff_longitude || null,
        dropoff_name,
        dropoff_phone,
        dropoff_region_id: dropoff_region_id || null,
        dropoff_district_id: dropoff_district_id || null,
        package_description: package_description || null,
        attachment_url: attachment_url || null,
        delivery_fee: priceApplied,
        distance_km: distanceKm,
        price_per_km_snapshot: pricePerKm,
        price_applied: priceApplied,
        pricing_method: pricingMethod,
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

    // Create charge with delivery fee
    if (priceApplied > 0 && businessId) {
      await supabaseAdmin
        .from('charges')
        .insert({
          delivery_id: deliveryData.id,
          business_id: businessId,
          amount: priceApplied,
          description: 'Delivery fee - Quick order',
        });
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

    // Send Notifications
    // 1. Client Notification
    try {
      await sendEventNotification('client_new_order_created', pickup_phone, {
        client_name: pickup_name,
        business_name: 'the sender',
        pickup_address: pickup_address,
        dropoff_address: dropoff_address
      });
    } catch (err) {
      console.error('Failed to send client notification:', err);
    }

    // 2. Admin Notification
    try {
      const { data: companyProfile } = await supabaseAdmin
        .from("company_profile")
        .select("phone")
        .eq("id", COMPANY_PROFILE_ID)
        .single();

      if (companyProfile?.phone) {
        await sendEventNotification('admin_new_delivery_order', companyProfile.phone, {
          business_name: pickup_name,
          pickup_address: pickup_address,
          dropoff_address: dropoff_address
        });
      }
    } catch (err) {
      console.error('Failed to send admin notification:', err);
    }

    return NextResponse.json({
      success: true,
      deliveryId: deliveryData.id,
      message: 'Delivery created successfully',
      deliveryFee: priceApplied,
      distanceKm,
      pricingMethod,
    });
  } catch (error) {
    console.error('Error creating quick order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

