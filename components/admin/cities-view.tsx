'use client'
import { CrudTable, ActiveBadge, type ColumnDef } from './crud-table'
import type { FieldDef } from './generic-form-dialog'

const columns: ColumnDef[] = [
  { key: 'name', label: 'Cidade', render: (r: any) => <span className="font-medium">{r.name}</span> },
  { key: 'state', label: 'UF', className: 'w-16' },
  { key: 'ibgeCode', label: 'IBGE', className: 'w-24', render: (r: any) => r.ibgeCode || '-' },
  { key: '_count', label: 'Clientes', className: 'w-24', render: (r: any) => r._count?.customers ?? 0 },
  { key: 'pops', label: 'POPs', className: 'w-20', render: (r: any) => r._count?.pops ?? 0 },
  { key: 'active', label: 'Status', className: 'w-24', render: (r: any) => <ActiveBadge active={r.active} /> },
]

const fields: FieldDef[] = [
  { name: 'name', label: 'Nome da cidade', type: 'text', required: true, colSpan: 2 },
  { name: 'state', label: 'UF', type: 'text', required: true, placeholder: 'SP', colSpan: 1 },
  { name: 'ibgeCode', label: 'Código IBGE', type: 'text', placeholder: '3550308', colSpan: 1 },
  { name: 'active', label: 'Ativa', type: 'switch', defaultValue: true, colSpan: 2,
    helper: 'Cidades inativas não aparecem em seleções de novos cadastros' },
  { name: 'notes', label: 'Observações', type: 'textarea', colSpan: 3 },
]

export function CitiesView() {
  return (
    <CrudTable
      endpoint="/api/admin/cities"
      title="Cidades de Atendimento"
      description="Cidades onde seu provedor opera. Vinculadas a POPs, condomínios e clientes."
      columns={columns}
      fields={fields}
      searchPlaceholder="Buscar por nome ou UF..."
      newButtonLabel="Nova cidade"
      onBeforeDelete={(r: any) => (r._count?.customers ?? 0) > 0 ? 'Esta cidade possui clientes vinculados. Remova-os antes de excluir.' : null}
    />
  )
}
