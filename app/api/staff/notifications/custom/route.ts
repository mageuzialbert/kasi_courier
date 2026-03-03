import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, supabaseAdmin } from '@/lib/auth-server';
import { sendSMS } from '@/lib/sms';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { user, role } = await getAuthenticatedUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (role !== 'ADMIN' && role !== 'STAFF') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { phones, message } = body;

    if (!phones || !Array.isArray(phones) || phones.length === 0) {
      return NextResponse.json({ error: 'At least one phone number is required' }, { status: 400 });
    }

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // Send SMS to all recipients
    for (const phone of phones) {
      const result = await sendSMS(phone, message);
      results.push({ phone, ...result });
      
      if (result.success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Sent successfully to ${successCount} recipients${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
      results
    });

  } catch (error) {
    console.error('Custom SMS API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
