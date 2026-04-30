// =============================================================================
// API de Configurações / Personalização
// =============================================================================
// O campo logoUrl no banco pode armazenar tanto uma URL externa
// (https://upload.wikimedia.org/wikipedia/commons/a/a0/Firefox_logo%2C_2019.svg) quanto um cloud_storage_path (logos/abc.png).
// Caso seja um path interno, geramos uma signed URL fresca em cada GET
// para evitar problemas de expiração.
// =============================================================================
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth, jsonSafe, apiError } from '@/lib/api-helpers'
import { getSignedDownloadUrl } from '@/lib/s3'

export const dynamic = 'force-dynamic'

async function ensureSettings() {
  return prisma.settings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' },
  })
}

// Resolve logoUrl: se for path interno, retorna signed URL fresca
async function resolveLogoUrl(stored: string | null): Promise<string | null> {
  if (!stored) return null
  if (stored.startsWith('http://') || stored.startsWith('https://')) return stored
  try {
    return await getSignedDownloadUrl(stored, 60 * 60 * 24 * 7)
  } catch (err) {
    console.error('[SETTINGS_LOGO_RESOLVE]', err)
    return null
  }
}

export async function GET() {
  try {
    const settings = await ensureSettings()
    // Removemos campos sensíveis do retorno
    const { receitaApiKey, oltApiToken, mikrotikApiPassword, signatureApiKey, smsApiKey, smtpPassword, whatsappApiKey, ...safe } = settings
    const resolvedLogo = await resolveLogoUrl(settings.logoUrl)
    return NextResponse.json({
      ...jsonSafe(safe),
      logoUrl: resolvedLogo,
      logoStoredValue: settings.logoUrl, // valor cru armazenado (path ou URL)
      hasReceitaApiKey: !!receitaApiKey,
      hasOltToken: !!oltApiToken,
      hasMikrotikPassword: !!mikrotikApiPassword,
      hasSignatureKey: !!signatureApiKey,
      hasSmsApiKey: !!smsApiKey,
      hasSmtpPassword: !!smtpPassword,
      hasWhatsappApiKey: !!whatsappApiKey,
    })
  } catch (error: any) {
    console.error('[SETTINGS_GET]', error)
    return apiError('Erro ao carregar configurações', 500)
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth()
  if (auth.response) return auth.response

  try {
    const body = await req.json()
    const data: any = {}
    const allowed = [
      // Identidade
      'companyName', 'companyDocument', 'companyAddress', 'companyPhone',
      'companyEmail', 'logoUrl',
      // Endereço estruturado
      'companyZipCode', 'companyStreet', 'companyNumber', 'companyComplement',
      'companyNeighborhood', 'companyCity', 'companyState',
      // Dados fiscais e contato adicional
      'companyIE', 'companyIM', 'companyWebsite', 'companyWhatsapp',
      // Tema
      'primaryColor', 'secondaryColor', 'accentColor',
      // Integrações
      'receitaApiKey', 'oltApiUrl', 'oltApiToken', 'mikrotikApiUrl',
      'mikrotikApiUser', 'mikrotikApiPassword', 'signatureApiKey', 'signatureProvider',
      'smsProvider', 'smsApiKey',
      // Comunicação (Etapa 3)
      'emailProvider', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpPassword',
      'smtpFromEmail', 'smtpFromName',
      'whatsappProvider', 'whatsappApiUrl', 'whatsappApiKey',
      // Cobrança (Etapa 2)
      'billingDueDay', 'billingGracePeriod', 'billingInterestRate', 'billingFineRate',
      'billingAutoGenerate', 'billingPixKey', 'billingBankName', 'billingBankAgency',
      'billingBankAccount', 'billingNotes',
    ]
    for (const k of allowed) {
      if (k in body) data[k] = body[k] === '' ? null : body[k]
    }
    // Conversões de tipo para campos numéricos/booleanos do billing
    if ('billingDueDay' in data && data.billingDueDay !== null) data.billingDueDay = Number(data.billingDueDay)
    if ('billingGracePeriod' in data && data.billingGracePeriod !== null) data.billingGracePeriod = Number(data.billingGracePeriod)
    if ('billingInterestRate' in data && data.billingInterestRate !== null) data.billingInterestRate = Number(data.billingInterestRate)
    if ('billingFineRate' in data && data.billingFineRate !== null) data.billingFineRate = Number(data.billingFineRate)
    if ('billingAutoGenerate' in data) data.billingAutoGenerate = !!data.billingAutoGenerate
    if ('smtpPort' in data && data.smtpPort !== null) data.smtpPort = Number(data.smtpPort)

    await ensureSettings()
    const settings = await prisma.settings.update({
      where: { id: 'singleton' },
      data,
    })
    const { receitaApiKey, oltApiToken, mikrotikApiPassword, signatureApiKey, smsApiKey, smtpPassword, whatsappApiKey, ...safe } = settings
    const resolvedLogo = await resolveLogoUrl(settings.logoUrl)
    return NextResponse.json({
      ...jsonSafe(safe),
      logoUrl: resolvedLogo,
      logoStoredValue: settings.logoUrl,
      hasReceitaApiKey: !!receitaApiKey,
      hasOltToken: !!oltApiToken,
      hasMikrotikPassword: !!mikrotikApiPassword,
      hasSignatureKey: !!signatureApiKey,
      hasSmsApiKey: !!smsApiKey,
      hasSmtpPassword: !!smtpPassword,
      hasWhatsappApiKey: !!whatsappApiKey,
    })
  } catch (error: any) {
    console.error('[SETTINGS_PATCH]', error)
    return apiError('Erro ao salvar configurações', 500)
  }
}
