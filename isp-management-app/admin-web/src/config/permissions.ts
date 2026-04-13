export type UserRole = 'admin' | 'financeiro' | 'suporte';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  financeiro: 'Financeiro',
  suporte: 'Suporte',
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  admin: [
    'dashboard:view',
    'customers:view',
    'orders:view',
    'technicians:view',
    'network:view',
    'billing:view',
    'plans:view',
    'stock:view',
    'reports:view',
    'permissions:view',
    'users:view',
    'integrations:view',
  ],
  financeiro: [
    'dashboard:view',
    'customers:view',
    'billing:view',
    'reports:view',
  ],
  suporte: [
    'dashboard:view',
    'customers:view',
    'orders:view',
    'technicians:view',
    'network:view',
    'stock:view',
  ],
};

export const hasPermission = (role: UserRole, permission: string): boolean => {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
};
