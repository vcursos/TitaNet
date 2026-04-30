// =============================================================================
// API de Fatura individual - GET / PATCH / DELETE
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'

export const dynamic = 'force-dynamic'

const INCLUDE = {
  customer: { select: { id: true, name: true, document: true, email: true, phone: true } },
  payments: { orderBy: { paymentDate: 'desc' as const } },
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const inv = await prisma.invoice.findUnique({ where: { id: params.id }, include: INCLUDE })
    if (!inv) return apiError('Fatura não encontrada', 404)
    return NextResponse.json(jsonSafe(inv))
  } catch (err: any) {
    console.error('[INVOICE_GET]', err)
    return apiError('Erro ao buscar fatura', 500)
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const b = await req.json()
    const data: any = {}

    // Campos editáveis
    if ('dueDate' in b) data.dueDate = new Date(b.dueDate)
    if ('discount' in b) data.discount = Number(b.discount ?? 0)
    if ('notes' in b) data.notes = b.notes || null
    if ('barcode' in b) data.barcode = b.barcode || null
    if ('pixCode' in b) data.pixCode = b.pixCode || null
    if ('status' in b) data.status = b.status

    // Recalcular total se desconto mudou
    if ('discount' in b || 'interest' in b || 'fine' in b) {
      const current = await prisma.invoice.findUnique({ where: { id: params.id } })
      if (current) {
        const amt = Number(current.amount)
        const disc = 'discount' in b ? Number(b.discount ?? 0) : Number(current.discount)
        const int = 'interest' in b ? Number(b.interest ?? 0) : Number(current.interest)
        const fn = 'fine' in b ? Number(b.fine ?? 0) : Number(current.fine)
        data.discount = disc
        data.interest = int
        data.fine = fn
        data.totalAmount = Math.max(0, amt - disc + int + fn)
      }
    }

    // Cancelamento
    if (b.status === 'cancelled') {
      data.paidAt = null; data.paidAmount = null; data.paymentMethod = null
    }

    const updated = await prisma.invoice.update({
      where: { id: params.id }, data, include: INCLUDE,
    })
    return NextResponse.json(jsonSafe(updated))
  } catch (err: any) {
    console.error('[INVOICE_PATCH]', err)
    return apiError('Erro ao atualizar fatura', 500)
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    // Remover pagamentos vinculados antes
    await prisma.payment.deleteMany({ where: { invoiceId: params.id } })
    await prisma.invoice.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[INVOICE_DELETE]', err)
    return apiError('Erro ao excluir fatura', 500)
  }
}
