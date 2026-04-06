import { createClient } from '@supabase/supabase-js';

type AdminClient = any;

let adminClient: AdminClient | null = null;

function getRequiredEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'SUPABASE_SERVICE_ROLE_KEY') {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

export function getSupabaseAdmin(): AdminClient {
  if (!adminClient) {
    adminClient = createClient(
      getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
      getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return adminClient;
}

export const supabaseAdmin = new Proxy({} as AdminClient, {
  get(_target, property) {
    const client = getSupabaseAdmin() as Record<PropertyKey, any>;
    const value = client[property];

    return typeof value === 'function' ? value.bind(client) : value;
  },
});
