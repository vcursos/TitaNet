'use client'
import { CrudTable, ActiveBadge, type ColumnDef } from './crud-table'
import type { FieldDef } from './generic-form-dialog'

const SERVER_TYPES = [
  { value: 'mikrotik', label: 'MikroTik' },
  { value: 'radius', label: 'Radius' },
  { value: 'olt', label: 'OLT' },
  { value: 'dns', label: 'DNS' },
  { value: 'dhcp', label: 'DHCP' },
  { value: 'other', label: 'Outro' },
]

const columns: ColumnDef[] = [
  { key: 'name', label: 'Servidor', render: (r: any) => <span className="font-medium">{r.name}</span> },
  { key: 'type', label: 'Tipo', className: 'w-24', render: (r: any) => (
    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{r.type}</span>
  ) },
  { key: 'host', label: 'Host', render: (r: any) => r.host ? `${r.host}${r.port ? ':' + r.port : ''}` : '-' },
  { key: 'pop', label: 'POP', render: (r: any) => r.pop?.name || '-' },
  { key: 'active', label: 'Status', className: 'w-24', render: (r: any) => <ActiveBadge active={r.active} /> },
]

const fields: FieldDef[] = [
  { name: 'name', label: 'Nome', type: 'text', required: true, colSpan: 2 },
  { name: 'type', label: 'Tipo', type: 'select', required: true, options: SERVER_TYPES, colSpan: 1 },
  { name: 'host', label: 'Host / IP', type: 'text', placeholder: '192.168.1.1', colSpan: 2 },
  { name: 'port', label: 'Porta', type: 'number', placeholder: '8728', colSpan: 1 },
  { name: 'username', label: 'Usuário', type: 'text', colSpan: 1 },
  { name: 'password', label: 'Senha', type: 'password', colSpan: 1 },
  { name: 'apiToken', label: 'Token / API Key', type: 'password', colSpan: 1 },
  { name: 'popId', label: 'POP', type: 'select-async', asyncEndpoint: '/api/admin/pops', colSpan: 2 },
  { name: 'active', label: 'Ativo', type: 'switch', defaultValue: true, colSpan: 1 },
  { name: 'notes', label: 'Observações', type: 'textarea', colSpan: 3 },
]

export function ServersView() {
  return (
    <CrudTable
      endpoint="/api/admin/servers"
      title="Servidores"
      description="Cadastro de MikroTiks, Radius, OLTs e demais servidores. Tokens/credenciais usados pelas integrações."
      columns={columns}
      fields={fields}
      searchPlaceholder="Buscar por nome, host ou tipo..."
      newButtonLabel="Novo servidor"
    />
  )
}
