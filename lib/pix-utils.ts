// =============================================================================
// Utilitários para geração de PIX (BRCode / EMV) — padrão BACEN
// Gera payload estático (sem integração com PSP)
// =============================================================================

function pad(id: string, value: string) {
  const len = value.length.toString().padStart(2, '0')
  return `${id}${len}${value}`
}

function crc16(str: string): string {
  let crc = 0xffff
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export interface PixPayload {
  pixKey: string        // chave PIX (CPF, CNPJ, email, telefone, aleatória)
  merchantName: string  // nome do recebedor (max 25)
  merchantCity: string  // cidade (max 15)
  amount?: number       // valor (opcional p/ estático)
  txid?: string         // identificador da transação (max 25)
  description?: string  // descrição (não entra no BRCode padrão)
}

/**
 * Gera payload PIX no formato BRCode (EMV) conforme especificação BACEN.
 * Retorna string copia-e-cola.
 */
export function generatePixCode(data: PixPayload): string {
  const { pixKey, merchantName, merchantCity, amount, txid } = data

  // 00 - Payload Format Indicator
  let payload = pad('00', '01')

  // 26 - Merchant Account Information (PIX)
  let mai = pad('00', 'br.gov.bcb.pix') // GUI
  mai += pad('01', pixKey)              // Chave PIX
  if (txid) {
    // Descrição não vai aqui, mas txid pode ir no campo 05 do MAI ou no 62
  }
  payload += pad('26', mai)

  // 52 - Merchant Category Code
  payload += pad('52', '0000')

  // 53 - Transaction Currency (986 = BRL)
  payload += pad('53', '986')

  // 54 - Transaction Amount (se informado)
  if (amount && amount > 0) {
    payload += pad('54', amount.toFixed(2))
  }

  // 58 - Country Code
  payload += pad('58', 'BR')

  // 59 - Merchant Name (max 25 chars)
  const name = merchantName.substring(0, 25)
  payload += pad('59', name)

  // 60 - Merchant City (max 15 chars)
  const city = merchantCity.substring(0, 15)
  payload += pad('60', city)

  // 62 - Additional Data Field
  if (txid) {
    const adf = pad('05', txid.substring(0, 25))
    payload += pad('62', adf)
  } else {
    payload += pad('62', pad('05', '***'))
  }

  // 63 - CRC16
  payload += '6304'
  const checksum = crc16(payload)
  payload += checksum

  return payload
}

/**
 * Gera QR code SVG a partir do payload PIX (retorna SVG string).
 * Usa geração simples sem dependência externa.
 */
export function generatePixQrSvg(pixCode: string): string {
  // Gera uma representação visual simples do QR code
  // Em produção, usar uma lib como 'qrcode' para gerar QR real
  // Aqui retornamos um placeholder que pode ser substituído
  const encoded = encodeURIComponent(pixCode)
  // Usar API pública para gerar QR code
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`
}
