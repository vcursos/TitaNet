// =============================================================================
// API de Envio de Mensagens
// POST: envio individual ou em lote
// Suporta: template + customerId(s) ou mensagem direta
// [MOCK] - O envio real (SMTP/SMS/WhatsApp) é simulado.
//          Substituir pela integração real com o provider configurado.
// =============================================================================
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, apiError } from '@/lib/api-helpers'
import { renderTemplate } from '@/lib/message-renderer'

export const dynamic = 'force-dynamic'

async function getSettings() {
  return prisma.settings.findUnique({ where: { id: 'singleton' } })
}

// [MOCK] Simula envio de email via SMTP
async function sendEmail(_to: string, _subject: string, _body: string, _settings: any): Promise<{ ok: boolean; error?: string }> {
  // TODO: implementar envio real via nodemailer ou provider SMTP configurado
  // const transporter = nodemailer.createTransport({ host: settings.smtpHost, ... })
  // await transporter.sendMail({ from: settings.smtpFromEmail, to, subject, html: body })
  console.log(`[MOCK EMAIL] Para: ${_to} | Assunto: ${_subject}`)
  return { ok: true }
}

// [MOCK] Simula envio de SMS
async function sendSms(_to: string, _body: string, _settings: any): Promise<{ ok: boolean; error?: string }> {
  // TODO: implementar envio real via provider SMS (Zenvia, Twilio, etc.)
  console.log(`[MOCK SMS] Para: ${_to} | Mensagem: ${_body.substring(0, 80)}...`)
  return { ok: true }
}

// [MOCK] Simula envio de WhatsApp
async function sendWhatsapp(_to: string, _body: string, _settings: any): Promise<{ ok: boolean; error?: string }> {
  // TODO: implementar envio real via provider WhatsApp (Evolution API, Z-API, etc.)
  console.log(`[MOCK WHATSAPP] Para: ${_to} | Mensagem: ${_body.substring(0, 80)}...`)
  return { ok: true }
}

export async function POST(req: Request) {
  const auth = await requireAuth(); if (auth.response) return auth.response
  try {
    const body = await req.json()
    const {
      templateId,   // ID do template (opcional se body direto)
      customerIds,  // Array de IDs de clientes
      channel,      // email | sms | whatsapp (override do template)
      subject,      // Assunto (override) - apenas email
      messageBody,  // Corpo direto (se sem template)
      invoiceId,    // Fatura de contexto (opcional)
    } = body

    if (!customerIds?.length) return apiError('Selecione ao menos um cliente', 400)

    const settings = await getSettings()
    let template: any = null
    if (templateId) {
      template = await prisma.messageTemplate.findUnique({ where: { id: templateId } })
      if (!template) return apiError('Template não encontrado', 404)
    }

    if (!template && !messageBody) return apiError('Forneça um template ou corpo da mensagem', 400)

    const effectiveChannel = channel || template?.channel || 'email'
    const effectiveSubject = subject || template?.subject || 'Mensagem do provedor'
    const tplBody = template?.body || messageBody

    // Buscar clientes
    const customers = await prisma.customer.findMany({
      where: { id: { in: customerIds } },
      include: { plan: true },
    })

    // Buscar fatura de contexto se fornecida
    let invoice: any = null
    if (invoiceId) {
      invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } })
    }

    const results: { customerId: string; status: string; error?: string }[] = []

    for (const customer of customers) {
      // Determinar destinatário
      let recipient = ''
      if (effectiveChannel === 'email') recipient = customer.email || ''
      else recipient = customer.phone || ''

      if (!recipient) {
        const log = await prisma.messageLog.create({
          data: {
            customerId: customer.id,
            templateId: template?.id || null,
            channel: effectiveChannel,
            recipient: 'N/A',
            subject: effectiveChannel === 'email' ? effectiveSubject : null,
            body: tplBody,
            status: 'failed',
            error: `Cliente sem ${effectiveChannel === 'email' ? 'email' : 'telefone'} cadastrado`,
            sentBy: auth.session.user.id,
          },
        })
        results.push({ customerId: customer.id, status: 'failed', error: log.error || undefined })
        continue
      }

      // Renderizar template com dados do cliente
      const rendered = renderTemplate(tplBody, {
        customer,
        invoice,
        company: settings,
      })
      const renderedSubject = effectiveChannel === 'email'
        ? renderTemplate(effectiveSubject, { customer, invoice, company: settings })
        : null

      // [MOCK] Enviar
      let sendResult: { ok: boolean; error?: string }
      if (effectiveChannel === 'sms') sendResult = await sendSms(recipient, rendered, settings)
      else if (effectiveChannel === 'whatsapp') sendResult = await sendWhatsapp(recipient, rendered, settings)
      else sendResult = await sendEmail(recipient, renderedSubject || '', rendered, settings)

      // Registrar no log
      const log = await prisma.messageLog.create({
        data: {
          customerId: customer.id,
          templateId: template?.id || null,
          channel: effectiveChannel,
          recipient,
          subject: renderedSubject,
          body: rendered,
          status: sendResult.ok ? 'sent' : 'failed',
          error: sendResult.error || null,
          sentAt: sendResult.ok ? new Date() : null,
          sentBy: auth.session.user.id,
        },
      })

      results.push({ customerId: customer.id, status: log.status, error: log.error || undefined })
    }

    const sent = results.filter(r => r.status === 'sent').length
    const failed = results.filter(r => r.status === 'failed').length

    return NextResponse.json({
      total: results.length,
      sent,
      failed,
      results,
    })
  } catch (e: any) { return apiError(e.message, 500) }
}
