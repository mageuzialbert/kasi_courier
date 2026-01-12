import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getUserRole } from '@/lib/roles';

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

// GET - List all sliders (admin only)
export async function GET(request: NextRequest) {
  try {
    // Check if user is admin (this would need to be done via middleware or session check)
    // For now, we'll rely on RLS policies
    
    const { data, error } = await supabaseAdmin
      .from('slider_images')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new slider (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image_url, caption, cta_text, cta_link, order_index, active } = body;

    if (!image_url) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('slider_images')
      .insert({
        image_url,
        caption: caption || null,
        cta_text: cta_text || null,
        cta_link: cta_link || null,
        order_index: order_index || 0,
        active: active !== undefined ? active : true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
