// =============================================================================
// Helpers de formatação
// =============================================================================

export function formatDocument(doc: string | null | undefined): string {
  if (!doc) return '-'
  const c = doc.replace(/\D/g, '')
  if (c.length === 11) return c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (c.length === 14) return c.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return doc
}

export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-'
  const c = phone.replace(/\D/g, '')
  if (c.length === 11) return c.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  if (c.length === 10) return c.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  return phone
}

export function formatBRL(value: number | string | null | undefined): string {
  const n = Number(value ?? 0)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatCEP(cep: string | null | undefined): string {
  if (!cep) return '-'
  const c = cep.replace(/\D/g, '')
  if (c.length === 8) return c.replace(/(\d{5})(\d{3})/, '$1-$2')
  return cep
}

export function statusLabel(status: string): { label: string; color: string } {
  switch (status) {
    case 'active': return { label: 'Ativo', color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' }
    case 'inactive': return { label: 'Inativo', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-400' }
    case 'overdue': return { label: 'Inadimplente', color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' }
    case 'suspended': return { label: 'Suspenso', color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' }
    case 'draft': return { label: 'Rascunho', color: 'bg-gray-100 text-gray-700' }
    case 'sent': return { label: 'Enviado', color: 'bg-blue-100 text-blue-700' }
    case 'signed': return { label: 'Assinado', color: 'bg-green-100 text-green-700' }
    case 'cancelled': return { label: 'Cancelado', color: 'bg-red-100 text-red-700' }
    default: return { label: status, color: 'bg-muted text-muted-foreground' }
  }
}
