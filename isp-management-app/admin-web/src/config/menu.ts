export interface MenuItem {
  key: string;
  label: string;
  path: string;
  permission: string;
}

export const MENU_ITEMS: MenuItem[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard', permission: 'dashboard:view' },
  { key: 'customers', label: 'Clientes', path: '/customers', permission: 'customers:view' },
  { key: 'orders', label: 'Ordens de Serviço', path: '/orders', permission: 'orders:view' },
  { key: 'technicians', label: 'Técnicos', path: '/technicians', permission: 'technicians:view' },
  { key: 'network', label: 'Rede', path: '/network', permission: 'network:view' },
  { key: 'billing', label: 'Financeiro', path: '/billing', permission: 'billing:view' },
  { key: 'plans', label: 'Planos', path: '/plans', permission: 'plans:view' },
  { key: 'stock', label: 'Estoque', path: '/stock', permission: 'stock:view' },
  { key: 'reports', label: 'Relatórios', path: '/reports', permission: 'reports:view' },
  { key: 'permissions', label: 'Permissões', path: '/permissions', permission: 'permissions:view' },
  { key: 'users', label: 'Usuários', path: '/users', permission: 'users:view' },
  { key: 'integrations', label: 'Integrações/Migração', path: '/integrations', permission: 'integrations:view' },
];
