'use client'
import { CrudTable, ActiveBadge, type ColumnDef } from './crud-table'
import type { FieldDef } from './generic-form-dialog'

const ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'operator', label: 'Operador / Atendente' },
  { value: 'technician', label: 'Técnico' },
  { value: 'salesperson', label: 'Vendedor' },
  { value: 'viewer', label: 'Visualizador' },
]

const roleLabel = (r: string) => ROLES.find((x) => x.value === r)?.label ?? r

const columns: ColumnDef[] = [
  { key: 'name', label: 'Nome', render: (r: any) => (
    <div>
      <div className="font-medium">{r.name || '-'}</div>
      <div className="text-xs text-muted-foreground">{r.email}</div>
    </div>
  ) },
  { key: 'role', label: 'Perfil', render: (r: any) => (
    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
      {roleLabel(r.role)}
    </span>
  ) },
  { key: 'phone', label: 'Telefone', render: (r: any) => r.phone || '-' },
  { key: 'active', label: 'Status', className: 'w-24', render: (r: any) => <ActiveBadge active={r.active ?? true} /> },
]

const fields: FieldDef[] = [
  { name: 'name', label: 'Nome', type: 'text', colSpan: 2 },
  { name: 'role', label: 'Perfil', type: 'select', required: true, options: ROLES, defaultValue: 'operator', colSpan: 1 },
  { name: 'email', label: 'Email', type: 'email', required: true, colSpan: 2 },
  { name: 'phone', label: 'Telefone', type: 'tel', colSpan: 1 },
  { name: 'password', label: 'Senha', type: 'password', colSpan: 2,
    helper: 'Mínimo 8 caracteres. Deixe em branco ao editar para não alterar.' },
  { name: 'active', label: 'Ativo', type: 'switch', defaultValue: true, colSpan: 1 },
]

export function UsersView() {
  return (
    <CrudTable
      endpoint="/api/admin/users"
      title="Usuários do Sistema"
      description="Administradores, atendentes, técnicos e vendedores que acessam o painel."
      columns={columns}
      fields={fields}
      searchPlaceholder="Buscar por nome ou email..."
      newButtonLabel="Novo usuário"
    />
  )
}
