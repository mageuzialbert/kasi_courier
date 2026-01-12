import HeroSlider from '@/components/landing/HeroSlider';
import CTABar from '@/components/landing/CTABar';
import AboutSection from '@/components/landing/AboutSection';
import BusinessPartners from '@/components/landing/BusinessPartners';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

async function getSliders() {
  try {
    const { data, error } = await supabase
      .from('slider_images')
      .select('*')
      .eq('active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error fetching sliders:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching sliders:', error);
    return [];
  }
}

async function getAboutContent() {
  try {
    const { data, error } = await supabase
      .from('cms_content')
      .select('content')
      .eq('key', 'about_us')
      .single();

    if (error || !data) {
      return null;
    }

    return data.content;
  } catch (error) {
    console.error('Error fetching about content:', error);
    return null;
  }
}

async function getBusinessesData() {
  try {
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select('id, name, logo_url')
      .eq('active', true)
      .not('logo_url', 'is', null)
      .limit(20);

    const { count: totalBusinesses } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('active', true);

    const { count: totalDeliveries } = await supabase
      .from('deliveries')
      .select('*', { count: 'exact', head: true });

    return {
      businesses: businesses || [],
      totalBusinesses: totalBusinesses || 0,
      totalDeliveries: totalDeliveries || 0,
    };
  } catch (error) {
    console.error('Error fetching businesses data:', error);
    return {
      businesses: [],
      totalBusinesses: 0,
      totalDeliveries: 0,
    };
  }
}

export default async function Home() {
  const [sliders, aboutContent, businessesData] = await Promise.all([
    getSliders(),
    getAboutContent(),
    getBusinessesData(),
  ]);

  return (
    <main className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-primary">Kasi Courier</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-gray-700 hover:text-primary transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Slider */}
      <HeroSlider slides={sliders} />

      {/* CTA Bar */}
      <CTABar />

      {/* About Section */}
      <AboutSection content={aboutContent} />

      {/* Business Partners */}
      <BusinessPartners
        businesses={businessesData.businesses}
        totalBusinesses={businessesData.totalBusinesses}
        totalDeliveries={businessesData.totalDeliveries}
      />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Kasi Courier Services</h3>
              <p className="text-gray-400">
                Your trusted B2B logistics partner delivering excellence across Tanzania.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/register" className="hover:text-white transition-colors">
                    Register
                  </Link>
                </li>
                <li>
                  <Link href="/quick-order" className="hover:text-white transition-colors">
                    Order Delivery
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Login
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4">Contact</h3>
              <p className="text-gray-400">
                For inquiries, please contact us through your dashboard.
              </p>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} Kasi Courier Services. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
