import type { Metadata, Viewport } from "next";
import "./globals.css";
import { createClient } from '@/lib/supabase-server';
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration';

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

export const viewport: Viewport = {
  themeColor: '#22c55e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getCompanyProfile();
  
  const title = "Kasi Courier | #1 B2B Logistics & Delivery Service in Tanzania";
  const description = "Fast, reliable same-day delivery and courier services in Dar es Salaam. Track packages in real-time. Automated B2B logistics for 500+ Tanzanian businesses.";
  const url = "https://kasicourier.com";
  
  return {
    title: {
      default: title,
      template: `%s | Kasi Courier`
    },
    description: description,
    keywords: ["courier services tanzania", "logistics dar es salaam", "same day delivery", "b2b courier", "package tracking", "last mile delivery"],
    metadataBase: new URL(url),
    alternates: {
      canonical: '/',
    },
    openGraph: {
      title: title,
      description: description,
      url: url,
      siteName: 'Kasi Courier',
      locale: 'en_TZ',
      type: 'website',
      images: [
        {
          url: '/og-image.jpg', // Ensure this file is created or exists
          width: 1200,
          height: 630,
          alt: 'Kasi Courier Services',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: ['/og-image.jpg'],
    },
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      title: profile?.company_name || "Kasi Courier",
    },
    formatDetection: {
      telephone: true,
    },
    icons: profile?.favicon_url ? {
      icon: profile.favicon_url,
      shortcut: profile.favicon_url,
      apple: profile.favicon_url,
    } : {
      icon: '/icons/icon.svg',
      shortcut: '/icons/icon.svg',
      apple: '/icons/icon-maskable.svg',
    },
    other: {
      'mobile-web-app-capable': 'yes',
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Kasi Courier" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kasi Courier" />
        <meta name="msapplication-TileColor" content="#22c55e" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/icon-maskable.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-maskable.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-maskable.svg" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-maskable.svg" />
      </head>
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
