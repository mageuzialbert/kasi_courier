import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

// GET - Get active delivery fee packages for registration
export async function GET(request: NextRequest) {
  try {
    const { data: packages, error } = await supabaseAdmin
      .from('delivery_fee_packages')
      .select('id, name, description, fee_per_delivery, is_default')
      .eq('active', true)
      .order('fee_per_delivery', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(packages || []);
  } catch (error) {
    console.error('Error fetching public delivery packages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
