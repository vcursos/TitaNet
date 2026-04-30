// =============================================================================
// Renderizador de templates de mensagem
// Substitui placeholders {{...}} por dados reais do cliente/fatura
// =============================================================================

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface RenderContext {
  customer?: {
    name?: string | null
    document?: string | null
    email?: string | null
    phone?: string | null
    plan?: { name?: string | null } | null
    monthlyPrice?: any
  } | null
  invoice?: {
    number?: string | null
    referenceMonth?: string | null
    totalAmount?: any
    dueDate?: Date | string | null
    status?: string | null
  } | null
  company?: {
    companyName?: string | null
    companyPhone?: string | null
    companyEmail?: string | null
    companyWhatsapp?: string | null
    billingPixKey?: string | null
  } | null
  custom?: Record<string, string>
}

function toBRL(v: any): string {
  const n = typeof v === 'object' && v !== null ? Number(v) : Number(v)
  if (isNaN(n)) return 'R$ 0,00'
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return ''
  const dt = typeof d === 'string' ? new Date(d) : d
  return format(dt, 'dd/MM/yyyy', { locale: ptBR })
}

function fmtMonth(m: string | null | undefined): string {
  if (!m) return ''
  const [y, mo] = m.split('-')
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
  return `${months[parseInt(mo, 10) - 1]}/${y}`
}

export function renderTemplate(template: string, ctx: RenderContext): string {
  const c = ctx.customer
  const inv = ctx.invoice
  const co = ctx.company

  const vars: Record<string, string> = {
    customer_name: c?.name || 'Cliente',
    customer_document: c?.document || '',
    customer_email: c?.email || '',
    customer_phone: c?.phone || '',
    customer_plan: c?.plan?.name || '',
    customer_price: toBRL(c?.monthlyPrice),
    invoice_number: inv?.number || '',
    invoice_month: fmtMonth(inv?.referenceMonth),
    invoice_amount: toBRL(inv?.totalAmount),
    invoice_due_date: fmtDate(inv?.dueDate),
    invoice_status: inv?.status || '',
    company_name: co?.companyName || 'TitaNet',
    company_phone: co?.companyPhone || '',
    company_email: co?.companyEmail || '',
    company_whatsapp: co?.companyWhatsapp || '',
    company_pix: co?.billingPixKey || '',
    ...ctx.custom,
  }

  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key) => vars[key] ?? '')
}

// Lista de placeholders disponíveis para exibir na UI
export const AVAILABLE_PLACEHOLDERS = [
  { key: 'customer_name', label: 'Nome do cliente' },
  { key: 'customer_document', label: 'CPF/CNPJ' },
  { key: 'customer_email', label: 'E-mail do cliente' },
  { key: 'customer_phone', label: 'Telefone do cliente' },
  { key: 'customer_plan', label: 'Nome do plano' },
  { key: 'customer_price', label: 'Valor do plano' },
  { key: 'invoice_number', label: 'Número da fatura' },
  { key: 'invoice_month', label: 'Mês de referência' },
  { key: 'invoice_amount', label: 'Valor da fatura' },
  { key: 'invoice_due_date', label: 'Data de vencimento' },
  { key: 'company_name', label: 'Nome da empresa' },
  { key: 'company_phone', label: 'Telefone da empresa' },
  { key: 'company_email', label: 'E-mail da empresa' },
  { key: 'company_whatsapp', label: 'WhatsApp da empresa' },
  { key: 'company_pix', label: 'Chave PIX' },
]
