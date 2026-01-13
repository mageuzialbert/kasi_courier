import type { Metadata } from "next";
import "./globals.css";
import { createClient } from '@/lib/supabase-server';

async function getCompanyProfile() {
  try {
    const supabaseClient = await createClient();
    const { data } = await supabaseClient
      .from('company_profile')
      .select('company_name, favicon_url')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    return data;
  } catch (error) {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getCompanyProfile();
  
  return {
    title: profile?.company_name || "Kasi Courier Services",
    description: "B2B Logistics Delivery Platform",
    icons: profile?.favicon_url ? {
      icon: profile.favicon_url,
      shortcut: profile.favicon_url,
      apple: profile.favicon_url,
    } : undefined,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
