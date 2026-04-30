// =============================================================================
// Template HTML do Contrato (imprimível como PDF)
// =============================================================================
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

function formatDoc(doc: string | null | undefined): string {
  if (!doc) return '-'
  const clean = doc.replace(/\D/g, '')
  if (clean.length === 11) return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (clean.length === 14) return clean.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return doc
}

function safeFmt(d: Date | string | null | undefined): string {
  if (!d) return '-'
  try {
    return format(new Date(d), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  } catch {
    return '-'
  }
}

function toBRL(value: any): string {
  const n = Number(value ?? 0)
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function renderContractHtml(contract: any, settings: any): string {
  const c = contract?.customer ?? {}
  const plan = contract?.plan ?? {}
  const company = settings?.companyName ?? 'TitaNet Provedor'
  const companyDoc = settings?.companyDocument ?? ''
  const companyAddr = settings?.companyAddress ?? ''
  const primary = settings?.primaryColor ?? '#0066CC'

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Contrato ${contract?.contractNumber ?? ''}</title>
<style>
  @page { size: A4; margin: 18mm; }
  body { font-family: 'Helvetica', Arial, sans-serif; color: #111; line-height: 1.5; max-width: 780px; margin: 0 auto; padding: 24px; }
  h1 { color: ${primary}; font-size: 20pt; margin: 0 0 4px; }
  h2 { color: ${primary}; font-size: 13pt; margin: 24px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid ${primary}; padding-bottom: 12px; margin-bottom: 18px; }
  .meta { font-size: 9pt; color: #555; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  td { padding: 6px 8px; vertical-align: top; }
  td.label { width: 35%; color: #555; font-weight: 600; }
  .clause { font-size: 10pt; text-align: justify; margin: 10px 0; }
  .signatures { margin-top: 64px; display: flex; justify-content: space-between; gap: 32px; }
  .sig { width: 45%; text-align: center; border-top: 1px solid #333; padding-top: 6px; font-size: 9pt; }
  .print-btn { position: fixed; top: 16px; right: 16px; background: ${primary}; color: white; padding: 10px 16px; border-radius: 6px; border: none; cursor: pointer; font-size: 12pt; }
  @media print { .print-btn { display: none; } }
</style>
</head>
<body>
<button class="print-btn" onclick="window.print()">Imprimir / Salvar PDF</button>

<div class="header">
  <div>
    <h1>${company}</h1>
    <div class="meta">${companyDoc ? 'CNPJ: ' + formatDoc(companyDoc) : ''}</div>
    <div class="meta">${companyAddr ?? ''}</div>
  </div>
  <div class="meta" style="text-align:right">
    <strong>Contrato ${contract?.contractNumber ?? ''}</strong><br>
    Emitido em ${safeFmt(contract?.createdAt)}<br>
    Status: ${contract?.status ?? 'draft'}
  </div>
</div>

<h2>Contrato de Prestação de Serviços de Internet</h2>
<p class="clause">Pelo presente instrumento particular, de um lado <strong>${company}</strong>${companyDoc ? ', inscrita no CNPJ sob o nº ' + formatDoc(companyDoc) : ''}, doravante denominada <strong>CONTRATADA</strong>, e de outro lado:</p>

<h2>Dados do Contratante</h2>
<table>
  <tr><td class="label">Nome / Razão Social</td><td>${c.name ?? '-'}</td></tr>
  <tr><td class="label">${c.documentType === 'CNPJ' ? 'CNPJ' : 'CPF'}</td><td>${formatDoc(c.document)}</td></tr>
  <tr><td class="label">Email</td><td>${c.email ?? '-'}</td></tr>
  <tr><td class="label">Telefone</td><td>${c.phone ?? '-'}</td></tr>
  <tr><td class="label">Endereço</td><td>${[c.street, c.number, c.complement].filter(Boolean).join(', ') || '-'}</td></tr>
  <tr><td class="label">Bairro / Cidade / UF</td><td>${[c.neighborhood, c.city, c.state].filter(Boolean).join(' / ') || '-'}</td></tr>
  <tr><td class="label">CEP</td><td>${c.zipCode ?? '-'}</td></tr>
</table>

<h2>Serviço Contratado</h2>
<table>
  <tr><td class="label">Plano</td><td>${plan?.name ?? '-'}</td></tr>
  <tr><td class="label">Velocidade</td><td>${plan?.downloadMbps ?? '-'} Mbps de download / ${plan?.uploadMbps ?? '-'} Mbps de upload</td></tr>
  <tr><td class="label">Mensalidade</td><td>${toBRL(contract?.monthlyPrice)}</td></tr>
  <tr><td class="label">Vigência</td><td>Início em ${safeFmt(contract?.startDate)} ${contract?.endDate ? '- Término em ' + safeFmt(contract.endDate) : '(prazo indeterminado)'}</td></tr>
</table>

<h2>Cláusulas</h2>
<p class="clause"><strong>1. Objeto.</strong> A CONTRATADA fornecerá ao CONTRATANTE acesso à internet via banda larga conforme o plano descrito acima.</p>
<p class="clause"><strong>2. Pagamento.</strong> O valor mensal indicado deverá ser pago até a data de vencimento acordada. O atraso poderá ocasionar suspensão do serviço.</p>
<p class="clause"><strong>3. Equipamento.</strong> Os equipamentos cedidos pela CONTRATADA permanecem de sua propriedade e devem ser devolvidos em caso de cancelamento.</p>
<p class="clause"><strong>4. Suporte.</strong> A CONTRATADA prestará suporte técnico em horário comercial e atendimento de emergência 24h.</p>
<p class="clause"><strong>5. Foro.</strong> Fica eleito o foro da comarca da CONTRATADA para dirimir quaisquer controvérsias.</p>

<div class="signatures">
  <div class="sig">${company}<br><small>CONTRATADA</small></div>
  <div class="sig">${c.name ?? 'CONTRATANTE'}<br><small>${formatDoc(c.document)}</small></div>
</div>

</body></html>`
}
