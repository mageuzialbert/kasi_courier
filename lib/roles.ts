import { supabase } from './supabase';

export type UserRole = 'ADMIN' | 'STAFF' | 'RIDER' | 'BUSINESS';

export async function getUserRole(): Promise<UserRole | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get role from user metadata or users table
  const role = user.user_metadata?.role;
  if (role) {
    return role as UserRole;
  }

  // Fallback: check users table
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  return userData?.role || null;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<UserRole> {
  const role = await getUserRole();

  if (!role || !allowedRoles.includes(role)) {
    throw new Error('Unauthorized');
  }

  return role;
}

export function hasPermission(
  role: UserRole | null,
  permission: string
): boolean {
  if (!role) return false;

  const permissions: Record<UserRole, string[]> = {
    ADMIN: [
      'view_all_deliveries',
      'create_delivery',
      'assign_rider',
      'view_invoices',
      'generate_invoices',
      'view_reports',
      'manage_users',
      'manage_businesses',
    ],
    STAFF: [
      'view_all_deliveries',
      'create_delivery',
      'assign_rider',
      'view_invoices',
    ],
    RIDER: ['view_assigned_deliveries', 'update_delivery_status'],
    BUSINESS: ['create_delivery', 'view_own_deliveries', 'view_own_invoices'],
  };

  return permissions[role]?.includes(permission) || false;
}
