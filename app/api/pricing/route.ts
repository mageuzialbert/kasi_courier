import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

const COMPANY_PROFILE_ID = '00000000-0000-0000-0000-000000000001';

// GET - Public endpoint to fetch current price per km
export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('company_profile')
      .select('price_per_km')
      .eq('id', COMPANY_PROFILE_ID)
      .single();

    if (error) {
      return NextResponse.json(
        { price_per_km: 2000 }, // Fallback default
        { status: 200 }
      );
    }

    return NextResponse.json({
      price_per_km: data?.price_per_km ? parseFloat(data.price_per_km.toString()) : 2000,
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json(
      { price_per_km: 2000 },
      { status: 200 }
    );
  }
}
