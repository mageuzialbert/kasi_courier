import HeroSlider from '@/components/landing/HeroSlider';
import CTABar from '@/components/landing/CTABar';
import AboutSection from '@/components/landing/AboutSection';
import BusinessPartners from '@/components/landing/BusinessPartners';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { createClient } from '@/lib/supabase-server';

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

async function getCompanyProfile() {
  try {
    const supabaseClient = await createClient();
    const { data, error } = await supabaseClient
      .from('company_profile')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000001')
      .single();

    if (error) {
      // If no profile exists, return null
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('Error fetching company profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching company profile:', error);
    return null;
  }
}

export default async function Home() {
  const [sliders, aboutContent, businessesData, companyProfile] = await Promise.all([
    getSliders(),
    getAboutContent(),
    getBusinessesData(),
    getCompanyProfile(),
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
              {companyProfile?.logo_url ? (
                <img
                  src={companyProfile.logo_url}
                  alt={companyProfile.company_name || 'Company Logo'}
                  className="h-12 mb-4 object-contain"
                />
              ) : (
                <h3 className="text-xl font-bold mb-4">
                  {companyProfile?.company_name || 'Kasi Courier Services'}
                </h3>
              )}
              <p className="text-gray-400">
                {companyProfile?.address && (
                  <>
                    {companyProfile.address}
                    {companyProfile.city && `, ${companyProfile.city}`}
                    {companyProfile.region && `, ${companyProfile.region}`}
                    {companyProfile.postal_code && ` ${companyProfile.postal_code}`}
                    <br />
                  </>
                )}
                {companyProfile?.phone && (
                  <>
                    Phone: <a href={`tel:${companyProfile.phone}`} className="hover:text-white transition-colors">{companyProfile.phone}</a>
                    <br />
                  </>
                )}
                {companyProfile?.email && (
                  <>
                    Email: <a href={`mailto:${companyProfile.email}`} className="hover:text-white transition-colors">{companyProfile.email}</a>
                    <br />
                  </>
                )}
                {companyProfile?.website && (
                  <>
                    Website: <a href={companyProfile.website} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{companyProfile.website}</a>
                  </>
                )}
                {!companyProfile && (
                  'Your trusted B2B logistics partner delivering excellence across Tanzania.'
                )}
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
              {companyProfile ? (
                <div className="space-y-2 text-gray-400">
                  {companyProfile.phone && (
                    <p>
                      <span className="font-medium">Phone:</span>{' '}
                      <a href={`tel:${companyProfile.phone}`} className="hover:text-white transition-colors">
                        {companyProfile.phone}
                      </a>
                    </p>
                  )}
                  {companyProfile.email && (
                    <p>
                      <span className="font-medium">Email:</span>{' '}
                      <a href={`mailto:${companyProfile.email}`} className="hover:text-white transition-colors">
                        {companyProfile.email}
                      </a>
                    </p>
                  )}
                  {companyProfile.address && (
                    <p>
                      <span className="font-medium">Address:</span>{' '}
                      {companyProfile.address}
                      {companyProfile.city && `, ${companyProfile.city}`}
                      {companyProfile.region && `, ${companyProfile.region}`}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-400">
                  For inquiries, please contact us through your dashboard.
                </p>
              )}
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} {companyProfile?.company_name || 'Kasi Courier Services'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
