'use client'
import { CrudTable, ActiveBadge, type ColumnDef } from './crud-table'
import type { FieldDef } from './generic-form-dialog'

const columns: ColumnDef[] = [
  { key: 'name', label: 'POP', render: (r: any) => (
    <div>
      <div className="font-medium">{r.name}</div>
      {r.code && <div className="text-xs text-muted-foreground">{r.code}</div>}
    </div>
  ) },
  { key: 'city', label: 'Cidade', render: (r: any) => r.city ? `${r.city.name}/${r.city.state}` : '-' },
  { key: 'address', label: 'Endereço', render: (r: any) => r.address || '-' },
  { key: '_count', label: 'Servidores', className: 'w-24', render: (r: any) => r._count?.servers ?? 0 },
  { key: 'active', label: 'Status', className: 'w-24', render: (r: any) => <ActiveBadge active={r.active} /> },
]

const fields: FieldDef[] = [
  { name: 'name', label: 'Nome do POP', type: 'text', required: true, colSpan: 2 },
  { name: 'code', label: 'Código', type: 'text', placeholder: 'POP-CTR-01', colSpan: 1 },
  { name: 'cityId', label: 'Cidade', type: 'select-async', asyncEndpoint: '/api/admin/cities',
    asyncMap: (c: any) => ({ value: c.id, label: `${c.name}/${c.state}` }), colSpan: 2 },
  { name: 'active', label: 'Ativo', type: 'switch', defaultValue: true, colSpan: 1 },
  { name: 'address', label: 'Endereço', type: 'text', colSpan: 3 },
  { name: 'latitude', label: 'Latitude', type: 'number', step: 'any', colSpan: 1 },
  { name: 'longitude', label: 'Longitude', type: 'number', step: 'any', colSpan: 1 },
  { name: 'description', label: 'Descrição', type: 'textarea', colSpan: 3 },
]

export function PopsView() {
  return (
    <CrudTable
      endpoint="/api/admin/pops"
      title="POPs / Pontos de Presença"
      description="Cadastro dos POPs (locais físicos onde ficam os equipamentos do provedor)."
      columns={columns}
      fields={fields}
      searchPlaceholder="Buscar por nome ou código..."
      newButtonLabel="Novo POP"
    />
  )
}
