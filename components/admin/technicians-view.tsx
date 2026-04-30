'use client'
import { CrudTable, ActiveBadge, type ColumnDef } from './crud-table'
import type { FieldDef } from './generic-form-dialog'
import { formatBRL, formatDocument } from '@/lib/format'

const columns: ColumnDef[] = [
  { key: 'name', label: 'Técnico', render: (r: any) => (
    <div>
      <div className="font-medium">{r.name}</div>
      {r.team && <div className="text-xs text-muted-foreground">{r.team}</div>}
    </div>
  ) },
  { key: 'document', label: 'CPF', render: (r: any) => formatDocument(r.document) },
  { key: 'phone', label: 'Telefone', render: (r: any) => r.phone || '-' },
  { key: 'baseSalary', label: 'Salário base', render: (r: any) => r.baseSalary ? formatBRL(r.baseSalary) : '-' },
  { key: 'perOrderRate', label: 'Por OS', render: (r: any) => r.perOrderRate ? formatBRL(r.perOrderRate) : '-' },
  { key: '_count', label: 'OS', className: 'w-16', render: (r: any) => r._count?.serviceOrders ?? 0 },
  { key: 'active', label: 'Status', className: 'w-24', render: (r: any) => <ActiveBadge active={r.active} /> },
]

const fields: FieldDef[] = [
  { name: 'name', label: 'Nome completo', type: 'text', required: true, colSpan: 2 },
  { name: 'document', label: 'CPF', type: 'text', colSpan: 1 },
  { name: 'email', label: 'Email', type: 'email', colSpan: 2 },
  { name: 'phone', label: 'Telefone', type: 'tel', colSpan: 1 },
  { name: 'team', label: 'Equipe / Setor', type: 'text', placeholder: 'Instalação, Manutenção...', colSpan: 2 },
  { name: 'active', label: 'Ativo', type: 'switch', defaultValue: true, colSpan: 1 },
  { name: 'baseSalary', label: 'Salário base (R$)', type: 'number', step: '0.01', colSpan: 1,
    helper: 'Pagamento fixo mensal' },
  { name: 'hourlyRate', label: 'Valor/hora (R$)', type: 'number', step: '0.01', colSpan: 1,
    helper: 'Pagamento por hora trabalhada' },
  { name: 'perOrderRate', label: 'Valor por OS (R$)', type: 'number', step: '0.01', colSpan: 1,
    helper: 'Comissão por OS concluída' },
  { name: 'notes', label: 'Observações', type: 'textarea', colSpan: 3 },
]

export function TechniciansView() {
  return (
    <CrudTable
      endpoint="/api/admin/technicians"
      title="Técnicos"
      description="Cadastro de técnicos de campo, com pagamento por produção (base + hora + OS)."
      columns={columns}
      fields={fields}
      searchPlaceholder="Buscar por nome, email ou equipe..."
      newButtonLabel="Novo técnico"
    />
  )
}
