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
    const { phone, code, businessName, districtId } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone and code are required' },
        { status: 400 }
      );
    }

    // Normalize phone number
    let phoneNumber = phone.trim();
    if (!phoneNumber.startsWith('+255')) {
      phoneNumber = '+255' + phoneNumber.replace(/^\+?255?/, '').replace(/\D/g, '');
    } else {
      phoneNumber = '+255' + phoneNumber.replace(/^\+255/, '').replace(/\D/g, '');
    }

    // Verify OTP
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('phone', phoneNumber)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpData) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpData.id);

    // Check if user exists
    const { data: existingUser, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phoneNumber)
      .single();

    let userId: string;
    let businessId: string | null = null;
    let email: string;

    if (userCheckError && userCheckError.code === 'PGRST116') {
      // User doesn't exist - create new user
      if (!businessName) {
        return NextResponse.json(
          { error: 'Business name is required for new users' },
          { status: 400 }
        );
      }

      // Generate email from phone (for Supabase auth requirement)
      email = `${phoneNumber.replace(/\+/g, '')}@kasicourier.local`;

      // Create auth user
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12), // Random password
        email_confirm: true,
        user_metadata: {
          business_name: businessName,
          phone: phoneNumber,
          role: 'BUSINESS',
        },
      });

      if (authError || !authData.user) {
        return NextResponse.json(
          { error: authError?.message || 'Failed to create user' },
          { status: 400 }
        );
      }

      userId = authData.user.id;

      // Create user record
      const { error: userError } = await supabaseAdmin
        .from('users')
        .upsert({
          id: userId,
          name: businessName,
          email: email,
          phone: phoneNumber,
          role: 'BUSINESS',
          active: true,
        }, {
          onConflict: 'id'
        });

      if (userError) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { error: userError.message },
          { status: 500 }
        );
      }

      // Create business record
      const { data: businessData, error: businessError } = await supabaseAdmin
        .from('businesses')
        .insert({
          name: businessName,
          phone: phoneNumber,
          user_id: userId,
          district_id: districtId || null,
          billing_cycle: 'WEEKLY',
          active: true,
        })
        .select('id')
        .single();

      if (businessError) {
        await supabaseAdmin.from('users').delete().eq('id', userId);
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json(
          { error: businessError.message },
          { status: 500 }
        );
      }

      businessId = businessData.id;
    } else if (existingUser) {
      // User exists - just verify and return session
      userId = existingUser.id;
      email = existingUser.email || `${phoneNumber.replace(/\+/g, '')}@kasicourier.local`;

      // Get business ID if user is a business
      if (existingUser.role === 'BUSINESS') {
        const { data: businessData } = await supabaseAdmin
          .from('businesses')
          .select('id')
          .eq('user_id', userId)
          .single();

        businessId = businessData?.id || null;
      }
    } else {
      return NextResponse.json(
        { error: 'Failed to process user' },
        { status: 500 }
      );
    }

    // Generate session tokens
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (linkError || !linkData) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      userId,
      businessId,
      accessToken: linkData.properties?.access_token,
      refreshToken: linkData.properties?.refresh_token,
    });
  } catch (error) {
    console.error('Error in quick verify OTP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
