import { createClient } from '@supabase/supabase-js';

const SMS_API_URL = process.env.SMS_API_URL || 'https://messaging-service.co.tz/api/sms/v1/text/single';
const SMS_API_AUTH = process.env.SMS_API_AUTH || 'bWFnZXV6aWFsYmVydDpIaCZiZXJ0bw==';
const SMS_SENDER = process.env.SMS_SENDER || 'iPAB';

// Create admin client for server-side operations
function getSupabaseAdmin() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendSMS(to: string, message: string): Promise<SMSResult> {
  try {
    const response = await fetch(SMS_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${SMS_API_AUTH}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        from: SMS_SENDER,
        text: message,
        to: to,
      }),
    });

    const responseData = await response.json();
    const httpCode = response.status;

    // Log SMS attempt using admin client
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { error: logError } = await supabaseAdmin.from('sms_logs').insert({
        to_phone: to,
        message: message,
        status: response.ok ? 'success' : 'failed',
        provider_response: JSON.stringify(responseData),
      });

      if (logError) {
        console.error('Failed to log SMS:', logError);
      }
    } catch (logErr) {
      console.error('Error creating admin client for SMS logging:', logErr);
    }

    if (!response.ok) {
      return {
        success: false,
        error: `SMS API returned ${httpCode}: ${JSON.stringify(responseData)}`,
      };
    }

    return {
      success: true,
      messageId: responseData.messageId || 'unknown',
    };
  } catch (error) {
    // Log error using admin client
    try {
      const supabaseAdmin = getSupabaseAdmin();
      await supabaseAdmin.from('sms_logs').insert({
        to_phone: to,
        message: message,
        status: 'failed',
        provider_response: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch (logErr) {
      console.error('Error logging SMS failure:', logErr);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendOTPSMS(phone: string, code: string): Promise<SMSResult> {
  const message = `Your Kasi Courier Services verification code is: ${code}. Valid for 5 minutes.`;
  return sendSMS(phone, message);
}
