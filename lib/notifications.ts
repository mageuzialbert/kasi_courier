import { createClient } from '@supabase/supabase-js';
import { sendSMS, SMSResult } from './sms';

// Helper to format a template string with variables
function formatTemplate(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    // Replace all instances of {{key}} with value
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

// Ensure we have a valid admin client since these events could be triggered from non-authenticated cron jobs or server actions
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

export type NotificationEventName = 
  | 'client_new_order_created'
  | 'client_order_delivered'
  | 'rider_new_ride_assignment'
  | 'admin_rider_created_ride'
  | 'admin_new_business_registered'
  | 'admin_new_delivery_order';

export async function sendEventNotification(
  eventName: NotificationEventName,
  recipientPhone: string,
  variables: Record<string, string>
): Promise<SMSResult | { success: false; error: string }> {
  try {
    const supabase = getSupabaseAdmin();

    // 1. Fetch template by eventName
    const { data: template, error } = await supabase
      .from('notification_templates')
      .select('*')
      .eq('name', eventName)
      .single();

    if (error || !template) {
      console.error(`Template not found for event: ${eventName}`, error);
      return { success: false, error: `Template not found for event: ${eventName}` };
    }

    // 2. Check if active
    if (!template.is_active) {
      return { success: true, messageId: 'skipped_inactive' };
    }

    // 3. Format message
    const formattedMessage = formatTemplate(template.content, variables);

    // 4. Send SMS
    const result = await sendSMS(recipientPhone, formattedMessage);

    return result;
  } catch (error) {
    console.error(`Error sending event notification ${eventName}:`, error);
    return { success: false, error: 'Internal error sending notification' };
  }
}
