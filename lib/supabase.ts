import { createBrowserClient } from '@supabase/ssr';

type BrowserClient = any;

let browserClient: BrowserClient | null = null;

const browserEnv = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
} as const;

function getRequiredEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
  const value = browserEnv[name];

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

export function getSupabaseBrowserClient(): BrowserClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
      getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    );
  }

  return browserClient;
}

export const supabase = new Proxy({} as BrowserClient, {
  get(_target, property) {
    const client = getSupabaseBrowserClient() as Record<PropertyKey, any>;
    const value = client[property];

    return typeof value === 'function' ? value.bind(client) : value;
  },
});
