"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Receipt,
  LogOut,
  Loader2,
  User,
  Shield,
  FileText,
  BarChart3,
  Image,
  Menu,
  X,
  Building2,
  Settings,
  CreditCard,
  FolderOpen,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { getCurrentUser, logout } from "@/lib/auth";
import { getUserRole } from "@/lib/roles";
import { PermissionsProvider, usePermissions } from "@/lib/permissions-context";
import VerificationBanner from "./business/components/VerificationBanner";

// Navigation item interface with permission requirements
interface NavItem {
  href: string;
  label: string;
  icon: any;
  permissions?: string[]; // Required permissions (any of these)
  modules?: string[]; // Required module access (any of these)
  children?: NavItem[];
}

function DashboardContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());

  const {
    hasModuleAccess,
    hasAnyPermission,
    loading: permissionsLoading,
  } = usePermissions();

  useEffect(() => {
    async function checkAuth() {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/login");
        return;
      }

      const userRole = await getUserRole();
      if (!userRole) {
        router.push("/login");
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
    router.push("/login");
  };

  // Get base dashboard path based on role
  const getDashboardBase = () => {
    switch (role) {
      case "BUSINESS":
        return "/dashboard/business";
      case "STAFF":
        return "/dashboard/staff";
      case "RIDER":
        return "/dashboard/rider";
      case "ADMIN":
        return "/dashboard/admin";
      default:
        return "/dashboard";
    }
  };

  const businessNavItems: NavItem[] = [
    { href: "/dashboard/business", label: "Overview", icon: LayoutDashboard },
    {
      href: "/dashboard/business/deliveries",
      label: "Deliveries",
      icon: Package,
    },
    { href: "/dashboard/business/invoices", label: "Invoices", icon: Receipt },
    { href: "/dashboard/business/profile", label: "Profile", icon: User },
    { href: "/dashboard/business/verify", label: "Verify", icon: Shield },
  ];

  // Admin has access to all items - no permission filtering needed
  const adminNavItems: NavItem[] = [
    { href: "/dashboard/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/admin/users", label: "Users", icon: User },
    {
      href: "#",
      label: "Contacts",
      icon: Building2,
      children: [
        { href: "/dashboard/admin/businesses", label: "Clients", icon: Building2 },
        { href: "/dashboard/admin/suppliers", label: "Suppliers", icon: Building2 },
      ],
    },
    {
      href: "/dashboard/staff/operations",
      label: "Operations",
      icon: BarChart3,
      children: [
        { href: "/dashboard/staff/deliveries", label: "Deliveries", icon: Package },
      ],
    },
    {
      href: "/dashboard/staff/financial",
      label: "Financials",
      icon: Receipt,
      children: [
        { href: "/dashboard/staff/deliveries", label: "Revenue", icon: BarChart3 },
        { href: "/dashboard/admin/expenses", label: "Expenses", icon: BarChart3 },
        { href: "/dashboard/admin/invoices", label: "Invoice", icon: FileText },
      ],
    },
    {
      href: "#",
      label: "Admin Settings",
      icon: Settings,
      children: [
        {
          href: "/dashboard/admin/company-profile",
          label: "Company Profile",
          icon: Settings,
        },
        { href: "/dashboard/admin/cms/sliders", label: "CMS Sliders", icon: Image },
        { href: "/dashboard/admin/cms/content", label: "CMS Content", icon: FileText },
        {
          href: "/dashboard/admin/payment-instructions",
          label: "Payment Instructions",
          icon: CreditCard,
        },
      ],
    },
  ];

  // Staff nav items with permission requirements
  const staffNavItems: NavItem[] = [
    { href: "/dashboard/staff", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/dashboard/staff/deliveries",
      label: "Deliveries",
      icon: Package,
      modules: ["deliveries"],
    },
    {
      href: "/dashboard/admin/businesses",
      label: "Clients",
      icon: Building2,
      modules: ["businesses"],
    },
    {
      href: "/dashboard/admin/users",
      label: "Users",
      icon: User,
      modules: ["users"],
    },
    {
      href: "/dashboard/staff/operations",
      label: "Operations",
      icon: BarChart3,
      modules: ["operations"],
    },
    {
      href: "/dashboard/staff/financial",
      label: "Financial",
      icon: Receipt,
      modules: ["financial"],
    },
    {
      href: "/dashboard/admin/invoices",
      label: "Invoices",
      icon: FileText,
      modules: ["invoices"],
    },
    {
      href: "/dashboard/admin/expenses",
      label: "Expenses",
      icon: BarChart3,
      modules: ["expenses"],
    },
    {
      href: "/dashboard/admin/suppliers",
      label: "Suppliers",
      icon: Building2,
      modules: ["expenses"],
    },
    {
      href: "/dashboard/admin/delivery-packages",
      label: "Packages",
      icon: FolderOpen,
      modules: ["delivery_packages"],
    },
    {
      href: "/dashboard/admin/cms/sliders",
      label: "CMS Sliders",
      icon: Image,
      modules: ["cms_sliders"],
    },
    {
      href: "/dashboard/admin/cms/content",
      label: "CMS Content",
      icon: FileText,
      modules: ["cms_content"],
    },
    {
      href: "/dashboard/admin/company-profile",
      label: "Company",
      icon: Settings,
      modules: ["company_profile"],
    },
    {
      href: "/dashboard/admin/payment-instructions",
      label: "Payments",
      icon: CreditCard,
      modules: ["payment_instructions"],
    },
  ];

  // Rider nav items with permission requirements
  const riderNavItems: NavItem[] = [
    { href: "/dashboard/rider", label: "Dashboard", icon: LayoutDashboard },
    {
      href: "/dashboard/rider/jobs",
      label: "My Jobs",
      icon: Package,
      permissions: ["deliveries.view_assigned"],
    },
    {
      href: "/dashboard/rider/create-delivery",
      label: "Create Delivery",
      icon: Package,
      permissions: ["deliveries.create"],
    },
    {
      href: "/dashboard/rider/register-business",
      label: "Register Client",
      icon: Building2,
      permissions: ["businesses.create"],
    },
  ];

  // Filter nav items based on permissions
  const hasItemAccess = (item: NavItem): boolean => {
    // Always show items without permission requirements
    if (!item.permissions && !item.modules) return true;

    // Check module access
    if (item.modules) {
      for (const mod of item.modules) {
        if (hasModuleAccess(mod)) return true;
      }
    }

    // Check specific permissions
    if (item.permissions && hasAnyPermission(item.permissions)) return true;

    return false;
  };

  const filterNavItems = (items: NavItem[]): NavItem[] => {
    return items.reduce<NavItem[]>((filtered, item) => {
      const filteredChildren = item.children ? filterNavItems(item.children) : undefined;
      const itemAccessible = hasItemAccess(item);

      // Parent-only group item (href "#") should only render when it has visible children
      if (item.href === "#") {
        if (filteredChildren && filteredChildren.length > 0) {
          filtered.push({ ...item, children: filteredChildren });
        }
        return filtered;
      }

      if (itemAccessible || (filteredChildren && filteredChildren.length > 0)) {
        filtered.push({
          ...item,
          children: filteredChildren,
        });
      }

      return filtered;
    }, []);
  };

  const getNavItems = (): NavItem[] => {
    if (role === "BUSINESS") return businessNavItems;
    if (role === "ADMIN") return adminNavItems;
    if (role === "STAFF") return filterNavItems(staffNavItems);
    if (role === "RIDER") return filterNavItems(riderNavItems);
    return [];
  };

  const navItems = getNavItems();
  const isPathActive = (href: string) => {
    if (!href || href === "#") return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const hasActiveChild = (children?: NavItem[]): boolean => {
    if (!children || children.length === 0) return false;
    return children.some((child) => isPathActive(child.href) || hasActiveChild(child.children));
  };

  const getMenuKey = (item: NavItem) => `${item.label}:${item.href}`;

  useEffect(() => {
    setExpandedMenus((prev) => {
      const next = new Set(prev);

      const expandActiveParents = (items: NavItem[]) => {
        items.forEach((item) => {
          if (item.children && item.children.length > 0) {
            if (isPathActive(item.href) || hasActiveChild(item.children)) {
              next.add(getMenuKey(item));
            }
            expandActiveParents(item.children);
          }
        });
      };

      expandActiveParents(navItems);
      return next;
    });
  }, [pathname, role, navItems.length]);

  const toggleMenu = (item: NavItem) => {
    const menuKey = getMenuKey(item);
    setExpandedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(menuKey)) {
        next.delete(menuKey);
      } else {
        next.add(menuKey);
      }
      return next;
    });
  };

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Mobile menu button */}
              {navItems.length > 0 && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden mr-3 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  aria-label="Toggle sidebar"
                >
                  {sidebarOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              )}
              <Link href={getDashboardBase()} className="flex items-center">
                <span className="text-2xl font-bold text-primary">
                  Kasi Courier
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 hidden sm:inline">
                {user?.user_metadata?.business_name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md hover:bg-gray-100"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex relative overflow-hidden">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        {navItems.length > 0 && (
          <aside
            className={`
              fixed lg:static
              top-16 left-0
              w-64 bg-white border-r border-gray-200
              min-h-[calc(100vh-4rem)] lg:min-h-[calc(100vh-4rem)]
              z-50 lg:z-auto
              transform transition-transform duration-300 ease-in-out
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            `}
          >
            <nav className="p-4 space-y-2">
              {navItems.map((item) => {
                const isGroup = item.href === "#";
                const itemIsActive = isPathActive(item.href) || hasActiveChild(item.children);
                const hasChildren = !!item.children && item.children.length > 0;
                const isExpanded = hasChildren && expandedMenus.has(getMenuKey(item));

                return (
                  <div key={`${item.label}-${item.href}`}>
                    {isGroup ? (
                      <button
                        type="button"
                        onClick={() => hasChildren && toggleMenu(item)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-md transition-colors ${
                          itemIsActive
                            ? "bg-primary/10 text-primary"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                        aria-expanded={isExpanded}
                      >
                        <span className="flex items-center space-x-3">
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </span>
                        {hasChildren &&
                          (isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          ))}
                      </button>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Link
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex-1 flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                            itemIsActive
                              ? "bg-primary text-white"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <item.icon className="w-5 h-5" />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                        {hasChildren && (
                          <button
                            type="button"
                            onClick={() => toggleMenu(item)}
                            className={`p-2 rounded-md transition-colors ${
                              itemIsActive
                                ? "text-primary hover:bg-primary/10"
                                : "text-gray-500 hover:bg-gray-100"
                            }`}
                            aria-label={isExpanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
                            aria-expanded={isExpanded}
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    )}

                    {hasChildren && isExpanded && (
                      <div className="ml-5 mt-1 space-y-1 border-l border-gray-200 pl-3">
                        {(item.children ?? []).map((child) => {
                          const childIsActive = isPathActive(child.href) || hasActiveChild(child.children);
                          return (
                            <Link
                              key={`${child.label}-${child.href}`}
                              href={child.href}
                              onClick={() => setSidebarOpen(false)}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                                childIsActive
                                  ? "bg-primary text-white"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                              }`}
                            >
                              <child.icon className="w-4 h-4" />
                              <span className="font-medium">{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 p-6 w-full lg:w-auto min-w-0 overflow-x-auto">
          {role === "BUSINESS" && <VerificationBanner />}
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PermissionsProvider>
      <DashboardContent>{children}</DashboardContent>
    </PermissionsProvider>
  );
}
