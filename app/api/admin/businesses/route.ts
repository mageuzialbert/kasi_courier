import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';

// GET - List all businesses
export async function GET(request: NextRequest) {
  try {
    const { user, role } = await getAuthenticatedUser();

    if (!user || (role !== 'ADMIN' && role !== 'STAFF')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const active = searchParams.get('active');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query - start with basic select
    let query = supabaseAdmin
      .from('businesses')
      .select('*');

    // Apply active filter first
    if (active !== null) {
      if (active === 'true') {
        query = query.eq('active', true);
      } else {
        // For inactive: get records where active is false OR null
        // In Supabase, we can use multiple filters
        query = query.or('active.is.null,active.eq.false');
      }
    }

    // Apply search filter if provided
    if (search && search.trim()) {
      // Search in name or phone - need to combine with existing filters
      // Use or() for the search terms
      const searchTerm = `%${search.trim()}%`;
      query = query.or(`name.ilike.${searchTerm},phone.ilike.${searchTerm}`);
    }

    // Apply ordering and pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: businesses, error } = await query;
    
    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: error.message || 'Query failed' },
        { status: 500 }
      );
    }

    // Fetch user data separately and map to businesses
    if (businesses && businesses.length > 0) {
      const userIds = businesses
        .map((b: any) => b.user_id)
        .filter((id: any): id is string => id !== null && id !== undefined);
      
      if (userIds.length > 0) {
        const { data: users, error: userError } = await supabaseAdmin
          .from('users')
          .select('id, name, phone, role')
          .in('id', userIds);
        
        if (userError) {
          console.error('Error fetching users:', userError);
        } else {
          // Map users to businesses
          const userMap = new Map(users?.map((u: any) => [u.id, u]) || []);
          businesses.forEach((business: any) => {
            if (business.user_id && userMap.has(business.user_id)) {
              business.user = userMap.get(business.user_id);
            }
          });
        }
      }
    }

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(businesses || []);
  } catch (error) {
    console.error('Error fetching businesses:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
