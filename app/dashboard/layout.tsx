'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Package, Receipt, LogOut, Loader2, User, Shield, FileText, BarChart3, Image } from 'lucide-react';
import { getCurrentUser, logout } from '@/lib/auth';
import { getUserRole } from '@/lib/roles';
import VerificationBanner from './business/components/VerificationBanner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const userRole = await getUserRole();
      if (!userRole) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      setRole(userRole);
      setLoading(false);
    }

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Get base dashboard path based on role
  const getDashboardBase = () => {
    switch (role) {
      case 'BUSINESS':
        return '/dashboard/business';
      case 'STAFF':
        return '/dashboard/staff';
      case 'RIDER':
        return '/dashboard/rider';
      case 'ADMIN':
        return '/dashboard/admin';
      default:
        return '/dashboard';
    }
  };

  const businessNavItems = [
    { href: '/dashboard/business', label: 'Overview', icon: LayoutDashboard },
    { href: '/dashboard/business/deliveries', label: 'Deliveries', icon: Package },
    { href: '/dashboard/business/invoices', label: 'Invoices', icon: Receipt },
    { href: '/dashboard/business/profile', label: 'Profile', icon: User },
    { href: '/dashboard/business/verify', label: 'Verify', icon: Shield },
  ];

  const adminNavItems = [
    { href: '/dashboard/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/admin/businesses', label: 'Businesses', icon: Package },
    { href: '/dashboard/admin/users', label: 'Users', icon: User },
    { href: '/dashboard/staff/deliveries', label: 'Deliveries', icon: Package },
    { href: '/dashboard/staff/operations', label: 'Operations', icon: BarChart3 },
    { href: '/dashboard/staff/financial', label: 'Financial', icon: Receipt },
    { href: '/dashboard/admin/cms/sliders', label: 'CMS Sliders', icon: Image },
    { href: '/dashboard/admin/cms/content', label: 'CMS Content', icon: FileText },
  ];

  const staffNavItems = [
    { href: '/dashboard/staff', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/staff/deliveries', label: 'Deliveries', icon: Package },
    { href: '/dashboard/staff/operations', label: 'Operations', icon: BarChart3 },
    { href: '/dashboard/staff/financial', label: 'Financial', icon: Receipt },
  ];

  const riderNavItems = [
    { href: '/dashboard/rider', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/rider/jobs', label: 'My Jobs', icon: Package },
  ];

  const getNavItems = () => {
    if (role === 'BUSINESS') return businessNavItems;
    if (role === 'ADMIN') return adminNavItems;
    if (role === 'STAFF') return staffNavItems;
    if (role === 'RIDER') return riderNavItems;
    return [];
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href={getDashboardBase()} className="flex items-center">
                <span className="text-2xl font-bold text-primary">Kasi Courier</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.user_metadata?.business_name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar Navigation */}
        {navItems.length > 0 && (
          <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)]">
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6">
          {role === 'BUSINESS' && <VerificationBanner />}
          {children}
        </main>
      </div>
    </div>
  );
}
