import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role for admin operations
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
    const { phone, code } = await request.json();

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone and code are required' },
        { status: 400 }
      );
    }

    // Normalize phone number to ensure it matches what was stored
    let phoneNumber = phone.trim();
    if (!phoneNumber.startsWith('+255')) {
      phoneNumber = '+255' + phoneNumber.replace(/^\+?255?/, '').replace(/\D/g, '');
    } else {
      phoneNumber = '+255' + phoneNumber.replace(/^\+255/, '').replace(/\D/g, '');
    }

    // Verify OTP - first check if any OTP exists for this phone
    const { data: allOtps, error: checkError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('phone', phoneNumber)
      .order('created_at', { ascending: false })
      .limit(5);

    if (checkError) {
      console.error('Error checking OTPs:', checkError);
    } else {
      console.log(`Found ${allOtps?.length || 0} OTP records for ${phoneNumber}`);
      if (allOtps && allOtps.length > 0) {
        console.log('Recent OTPs:', allOtps.map(o => ({
          code: o.code,
          used: o.used,
          expires_at: o.expires_at,
          created_at: o.created_at
        })));
      }
    }

    // Verify OTP
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('otp_codes')
      .select('*')
      .eq('phone', phoneNumber)
      .eq('code', code.toString())
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (otpError || !otpData) {
      console.error('OTP verification error:', otpError);
      console.error('Looking for phone:', phoneNumber, 'code:', code, 'code type:', typeof code);
      
      // Provide more specific error message
      if (otpError?.code === 'PGRST116') {
        // Check if OTP exists but is used or expired
        const { data: usedOtp } = await supabaseAdmin
          .from('otp_codes')
          .select('*')
          .eq('phone', phoneNumber)
          .eq('code', code.toString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (usedOtp) {
          if (usedOtp.used) {
            return NextResponse.json(
              { error: 'This verification code has already been used. Please request a new one.' },
              { status: 400 }
            );
          }
          if (new Date(usedOtp.expires_at) < new Date()) {
            return NextResponse.json(
              { error: 'This verification code has expired. Please request a new one.' },
              { status: 400 }
            );
          }
        }
      }
      
      return NextResponse.json(
        { error: 'Invalid or expired OTP. Please check the code and try again.' },
        { status: 400 }
      );
    }

    // Mark OTP as used
    await supabaseAdmin
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpData.id);

    // Find user in users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('phone', phoneNumber)
      .single();

    if (userError || !userData || !userData.email) {
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 404 }
      );
    }

    // Find auth user by email
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
    const authUser = authUsers.users.find(u => u.email === userData.email);

    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication user not found' },
        { status: 404 }
      );
    }

    // Create a session using admin API
    // Use generateLink - it should return tokens in properties for magiclink type
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.email,
    });

    if (linkError) {
      console.error('Error generating magiclink:', JSON.stringify(linkError, null, 2));
      return NextResponse.json(
        { error: `Failed to create session: ${linkError.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    if (!linkData) {
      console.error('No link data returned from generateLink');
      return NextResponse.json(
        { error: 'Failed to create session. No data returned.' },
        { status: 500 }
      );
    }

    // Log full response for debugging
    console.log('Full linkData response:', JSON.stringify(linkData, null, 2));

    // Extract tokens - they should be in properties.access_token and properties.refresh_token
    let accessToken = linkData.properties?.access_token;
    let refreshToken = linkData.properties?.refresh_token;

    // If tokens are not in properties, they might be in the action_link URL hash
    if ((!accessToken || !refreshToken) && linkData.properties?.action_link) {
      try {
        const actionLink = linkData.properties.action_link;
        console.log('Tokens not in properties, trying to extract from URL:', actionLink);
        
        const urlObj = new URL(actionLink);
        
        // Tokens are typically in the hash fragment
        if (urlObj.hash) {
          const hash = urlObj.hash.substring(1); // Remove #
          const hashParams = new URLSearchParams(hash);
          const urlAccessToken = hashParams.get('access_token');
          const urlRefreshToken = hashParams.get('refresh_token');
          
          if (urlAccessToken) accessToken = urlAccessToken;
          if (urlRefreshToken) refreshToken = urlRefreshToken;
          
          console.log('Extracted from URL - accessToken:', !!urlAccessToken, 'refreshToken:', !!urlRefreshToken);
        }
      } catch (urlError) {
        console.error('Error parsing action_link URL:', urlError);
      }
    }

    // If we still don't have tokens, the generateLink method might not support returning tokens
    // for existing users. In this case, we need to use an alternative approach.
    if (!accessToken || !refreshToken) {
      console.error('No tokens found. Link data structure:', {
        hasProperties: !!linkData.properties,
        propertiesKeys: linkData.properties ? Object.keys(linkData.properties) : [],
        hasActionLink: !!linkData.properties?.action_link,
        hasHashedToken: !!linkData.properties?.hashed_token,
      });

      // Alternative: Use Supabase REST API to create a session token directly
      // This requires making a direct HTTP call to Supabase's auth endpoint
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        // Create a session by calling the admin API's token generation endpoint
        // Note: This is a workaround as generateLink doesn't always return tokens
        const response = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
          method: 'POST',
          headers: {
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'magiclink',
            email: userData.email,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          accessToken = data.properties?.access_token;
          refreshToken = data.properties?.refresh_token;
          
          // Try URL extraction again
          if ((!accessToken || !refreshToken) && data.properties?.action_link) {
            try {
              const urlObj = new URL(data.properties.action_link);
              if (urlObj.hash) {
                const hash = urlObj.hash.substring(1);
                const hashParams = new URLSearchParams(hash);
                accessToken = hashParams.get('access_token') || accessToken;
                refreshToken = hashParams.get('refresh_token') || refreshToken;
              }
            } catch (e) {
              console.error('Error parsing URL in fallback:', e);
            }
          }
        }
      } catch (apiError) {
        console.error('Fallback API call failed:', apiError);
      }
    }

    if (!accessToken || !refreshToken) {
      console.error('All attempts to get tokens failed. User ID:', authUser.id);
      return NextResponse.json(
        { 
          error: 'Failed to generate session tokens. Please try logging in with password instead.',
          ...(process.env.NODE_ENV === 'development' && {
            debug: 'generateLink did not return access_token or refresh_token in properties or URL'
          })
        },
        { status: 500 }
      );
    }

    // Return the session tokens
    return NextResponse.json({
      success: true,
      userId: authUser.id,
      email: userData.email,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
