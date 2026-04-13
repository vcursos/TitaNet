import { getWithFallback, postWithFallback } from './http';

export interface Boleto {
    id: string;
    customerId: string;
    amount: number;
    dueDate: string;
    status: 'Pendente' | 'Pago' | 'Vencido' | 'Estornado';
    barcode: string;
    pixQrCode?: string;
    discount?: number;
    paymentLink?: string;
}

export interface NotaFiscal {
    id: string;
    boletoId: string;
    customerId: string;
    amount: number;
    emissionDate: string;
    status: 'Pendente' | 'Enviada' | 'Erro';
    nfseLink?: string;
}

const MOCK_BOLETOS: Boleto[] = [
    { id: 'boleto-1', customerId: '1', amount: 120.5, dueDate: '2026-04-10', status: 'Pago', barcode: '12345678901234567890123456789012345678901234' },
    { id: 'boleto-2', customerId: '1', amount: 120.5, dueDate: '2026-05-10', status: 'Pendente', barcode: '23456789012345678901234567890123456789012345' },
    { id: 'boleto-3', customerId: '1', amount: 120.5, dueDate: '2026-03-10', status: 'Vencido', barcode: '34567890123456789012345678901234567890123456' },
    { id: 'boleto-4', customerId: '2', amount: 99.9, dueDate: '2026-05-05', status: 'Pendente', barcode: '45678901234567890123456789012345678901234567' },
];

const MOCK_NOTAS_FISCAIS: NotaFiscal[] = [
    { id: 'nf-1', boletoId: 'boleto-1', customerId: '1', amount: 120.5, emissionDate: '2026-04-11', status: 'Enviada', nfseLink: 'http://nfse.gov/link-para-nota-1' },
];

export const fetchBoletosByCustomerId = (customerId: string): Promise<Boleto[]> => {
    const data = MOCK_BOLETOS.filter(b => b.customerId === customerId);
    return getWithFallback(`/customers/${customerId}/boletos`, () => data);
};

export const fetchNotasFiscaisByCustomerId = (customerId: string): Promise<NotaFiscal[]> => {
    const data = MOCK_NOTAS_FISCAIS.filter(nf => nf.customerId === customerId);
    return getWithFallback(`/customers/${customerId}/notas-fiscais`, () => data);
};

export const marcarBoletoComoPago = (boletoId: string): Promise<{ success: true }> => {
    const boleto = MOCK_BOLETOS.find(b => b.id === boletoId);
    if (boleto) {
        boleto.status = 'Pago';
    }
    return postWithFallback(`/boletos/${boletoId}/marcar-pago`, {}, () => ({ success: true }));
};

export const estornarBoleto = (boletoId: string): Promise<{ success: true }> => {
    const boleto = MOCK_BOLETOS.find(b => b.id === boletoId);
    if (boleto) {
        boleto.status = 'Estornado';
    }
    return postWithFallback(`/boletos/${boletoId}/estornar`, {}, () => ({ success: true }));
};

export const modificarValorBoleto = (boletoId: string, newAmount: number): Promise<{ success: true }> => {
    const boleto = MOCK_BOLETOS.find(b => b.id === boletoId);
    if (boleto) {
        boleto.amount = newAmount;
    }
    return postWithFallback(`/boletos/${boletoId}/modificar`, { newAmount }, () => ({ success: true }));
};

export const adicionarDesconto = (boletoId: string, discount: number): Promise<{ success: true }> => {
    const boleto = MOCK_BOLETOS.find(b => b.id === boletoId);
    if (boleto) {
        boleto.discount = discount;
    }
    return postWithFallback(`/boletos/${boletoId}/desconto`, { discount }, () => ({ success: true }));
};

export const gerarPixParaBoleto = (boletoId: string): Promise<{ qrCode: string }> => {
    const qrCode = `pix-qr-code-for-${boletoId}-${Date.now()}`;
    const boleto = MOCK_BOLETOS.find(b => b.id === boletoId);
    if (boleto) {
        boleto.pixQrCode = qrCode;
    }
    return postWithFallback(`/boletos/${boletoId}/gerar-pix`, {}, () => ({ qrCode }));
};

export const gerarCarne = (customerId: string, numParcelas: 6 | 12): Promise<Boleto[]> => {
    const lastBoleto = MOCK_BOLETOS.filter(b => b.customerId === customerId).pop();
    const amount = lastBoleto?.amount ?? 100;
    const newBoletos: Boleto[] = [];
    for (let i = 1; i <= numParcelas; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);
        newBoletos.push({
            id: `carne-${customerId}-${i}-${Date.now()}`,
            customerId,
            amount,
            dueDate: dueDate.toISOString().slice(0, 10),
            status: 'Pendente',
            barcode: `carne-barcode-${i}-${Math.random()}`,
            paymentLink: `http://pagamento.provedor.com/b/${customerId}/${i}`
        });
    }
    MOCK_BOLETOS.push(...newBoletos);
    return postWithFallback(`/customers/${customerId}/gerar-carne`, { numParcelas }, () => newBoletos);
};

export const gerarNotaFiscal = (boletoId: string): Promise<NotaFiscal> => {
    const boleto = MOCK_BOLETOS.find(b => b.id === boletoId);
    if (!boleto || boleto.status !== 'Pago') {
        throw new Error('Boleto não encontrado ou não está pago.');
    }
    const newNota: NotaFiscal = {
        id: `nf-${boletoId}-${Date.now()}`,
        boletoId,
        customerId: boleto.customerId,
        amount: boleto.amount,
        emissionDate: new Date().toISOString().slice(0, 10),
        status: 'Pendente',
    };
    MOCK_NOTAS_FISCAIS.push(newNota);
    return postWithFallback(`/boletos/${boletoId}/gerar-nf`, {}, () => newNota);
};

export const enviarNotaFiscal = (notaId: string): Promise<{ success: true }> => {
    const nota = MOCK_NOTAS_FISCAIS.find(nf => nf.id === notaId);
    if (nota) {
        nota.status = 'Enviada';
    }
    return postWithFallback(`/notas-fiscais/${notaId}/enviar`, {}, () => ({ success: true }));
};
