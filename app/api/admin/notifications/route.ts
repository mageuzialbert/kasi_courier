import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// GET all notification templates
export async function GET(request: NextRequest) {
  try {
    const { user, role } = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (role !== 'ADMIN' && role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch templates
    const { data, error } = await supabaseAdmin
      .from('notification_templates')
      .select('*')
      .order('actor_type', { ascending: true })
      .order('title', { ascending: true });

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    return NextResponse.json({ templates: data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT to update a template (content and is_active)
export async function PUT(request: NextRequest) {
  try {
    const { user, role } = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (role !== 'ADMIN' && role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { id, content, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 });
    }

    // Update template
    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabaseAdmin
      .from('notification_templates')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating template:', error);
      return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
    }

    return NextResponse.json({ template: data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
