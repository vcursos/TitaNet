'use client'
import { CrudTable, ActiveBadge, type ColumnDef } from './crud-table'
import type { FieldDef } from './generic-form-dialog'

const columns: ColumnDef[] = [
  { key: 'name', label: 'Condomínio', render: (r: any) => (
    <div>
      <div className="font-medium">{r.name}</div>
      {r.cnpj && <div className="text-xs text-muted-foreground">{r.cnpj}</div>}
    </div>
  ) },
  { key: 'city', label: 'Cidade', render: (r: any) => r.city ? `${r.city.name}/${r.city.state}` : '-' },
  { key: 'managerName', label: 'Síndico', render: (r: any) => r.managerName || '-' },
  { key: 'unitsCount', label: 'Unidades', className: 'w-24', render: (r: any) => r.unitsCount ?? '-' },
  { key: '_count', label: 'Clientes', className: 'w-24', render: (r: any) => r._count?.customers ?? 0 },
  { key: 'active', label: 'Status', className: 'w-24', render: (r: any) => <ActiveBadge active={r.active} /> },
]

const fields: FieldDef[] = [
  { name: 'name', label: 'Nome do condomínio', type: 'text', required: true, colSpan: 2 },
  { name: 'cnpj', label: 'CNPJ', type: 'text', colSpan: 1 },
  { name: 'cityId', label: 'Cidade', type: 'select-async', asyncEndpoint: '/api/admin/cities',
    asyncMap: (c: any) => ({ value: c.id, label: `${c.name}/${c.state}` }), colSpan: 2 },
  { name: 'unitsCount', label: 'Total de unidades', type: 'number', colSpan: 1 },
  { name: 'zipCode', label: 'CEP', type: 'text', colSpan: 1 },
  { name: 'street', label: 'Rua', type: 'text', colSpan: 2 },
  { name: 'number', label: 'Número', type: 'text', colSpan: 1 },
  { name: 'complement', label: 'Complemento', type: 'text', colSpan: 1 },
  { name: 'neighborhood', label: 'Bairro', type: 'text', colSpan: 1 },
  { name: 'state', label: 'UF', type: 'text', colSpan: 1 },
  { name: 'managerName', label: 'Síndico / Responsável', type: 'text', colSpan: 1 },
  { name: 'managerPhone', label: 'Telefone', type: 'tel', colSpan: 1 },
  { name: 'managerEmail', label: 'Email', type: 'email', colSpan: 1 },
  { name: 'active', label: 'Ativo', type: 'switch', defaultValue: true, colSpan: 3 },
  { name: 'notes', label: 'Observações', type: 'textarea', colSpan: 3 },
]

export function CondominiumsView() {
  return (
    <CrudTable
      endpoint="/api/admin/condominiums"
      title="Condomínios"
      description="Condomínios atendidos. Clientes podem ser vinculados a um condomínio."
      columns={columns}
      fields={fields}
      searchPlaceholder="Buscar por nome, síndico ou CNPJ..."
      newButtonLabel="Novo condomínio"
    />
  )
}
