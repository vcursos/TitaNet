import React, { useState, useEffect } from 'react';
import { Boleto, fetchBoletosByCustomerId, marcarBoletoComoPago, gerarPixParaBoleto, gerarCarne, estornarBoleto, modificarValorBoleto, adicionarDesconto } from '../../api/billing';

interface BillingTabProps {
    customerId: string;
}

export const BillingTab: React.FC<BillingTabProps> = ({ customerId }) => {
    const [boletos, setBoletos] = useState<Boleto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [pixQrCode, setPixQrCode] = useState<string | null>(null);

    const loadBoletos = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchBoletosByCustomerId(customerId);
            setBoletos(data);
        } catch (err) {
            setError('Falha ao carregar boletos.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBoletos();
    }, [customerId]);

    const handleMarcarPago = async (boletoId: string) => {
        if (!window.confirm('Confirma a baixa manual deste boleto?')) return;
        await marcarBoletoComoPago(boletoId);
        loadBoletos();
    };

    const handleEstornar = async (boletoId: string) => {
        if (!window.confirm('Confirma o estorno deste boleto?')) return;
        await estornarBoleto(boletoId);
        loadBoletos();
    };

    const handleGerarPix = async (boletoId: string) => {
        const { qrCode } = await gerarPixParaBoleto(boletoId);
        setPixQrCode(qrCode);
        loadBoletos();
    };

    const handleGerarCarne = async (numParcelas: 6 | 12) => {
        if (!window.confirm(`Gerar ${numParcelas} boletos para o cliente?`)) return;
        await gerarCarne(customerId, numParcelas);
        loadBoletos();
    };

    const handleModificarValor = async (boletoId: string, currentVal: number) => {
        const newVal = prompt('Novo valor do boleto (R$):', String(currentVal));
        if (newVal) {
            const valNum = parseFloat(newVal.replace(',', '.'));
            if (!isNaN(valNum)) {
                await modificarValorBoleto(boletoId, valNum);
                loadBoletos();
            }
        }
    };

    const handleAdicionarDesconto = async (boletoId: string, currentDisc = 0) => {
        const newDisc = prompt('Valor do desconto (R$):', String(currentDisc));
        if (newDisc) {
            const discNum = parseFloat(newDisc.replace(',', '.'));
            if (!isNaN(discNum)) {
                await adicionarDesconto(boletoId, discNum);
                loadBoletos();
            }
        }
    };

    if (loading) return <p>Carregando boletos...</p>;
    if (error) return <p style={{ color: '#b91c1c' }}>{error}</p>;

    return (
        <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', 
                background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0', alignItems: 'center' }}>
                <span style={{ fontWeight: 600, color: '#334155', marginRight: 'auto' }}>Ações em Lote:</span>
                <button onClick={() => handleGerarCarne(6)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: 4, cursor: 'pointer' }}>Gerar 6 Boletos</button>
                <button onClick={() => handleGerarCarne(12)} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: 4, cursor: 'pointer' }}>Gerar 12 Boletos</button>
            </div>
            {pixQrCode && (
                <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc' }}>
                    <h4 style={{ marginTop: 0 }}>PIX QR Code Gerado</h4>
                    <p style={{ color: '#475569' }}>Aponte a câmera do seu celular para o código abaixo ou copie a chave:</p>
                    <pre style={{ background: '#e2e8f0', padding: '0.75rem', borderRadius: 4, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{pixQrCode}</pre>
                    <button onClick={() => setPixQrCode(null)} style={{ marginTop: '0.5rem', background: '#e2e8f0', border: '1px solid #cbd5e1', padding: '0.2rem 0.5rem', borderRadius: 4 }}>Fechar</button>
                </div>
            )}
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>ID</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Valor / Desconto</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Vencimento</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Status</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {boletos.map(boleto => (
                        <tr key={boleto.id} style={{ borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                            <td style={{ padding: '0.75rem' }}>{boleto.id}</td>
                            <td style={{ padding: '0.75rem' }}>
                                <div>R$ {boleto.amount.toFixed(2)}</div>
                                {boleto.discount ? <small style={{ color: '#059669' }}>Desc: R$ {boleto.discount.toFixed(2)}</small> : null}
                            </td>
                            <td style={{ padding: '0.75rem' }}>{new Date(boleto.dueDate).toLocaleDateString()}</td>
                            <td style={{ padding: '0.75rem' }}>
                                <span style={{ 
                                    padding: '0.15rem 0.4rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                                    background: boleto.status === 'Pago' ? '#dcfce7' : boleto.status === 'Vencido' ? '#fee2e2' : boleto.status === 'Estornado' ? '#f1f5f9' : '#fef9c3',
                                    color: boleto.status === 'Pago' ? '#166534' : boleto.status === 'Vencido' ? '#991b1b' : boleto.status === 'Estornado' ? '#475569' : '#a16207'
                                }}>
                                    {boleto.status}
                                </span>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    <button style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }} onClick={() => window.open(boleto.paymentLink || '#', '_blank')}>Ver Boleto</button>
                                    
                                    {boleto.status === 'Pendente' && <>
                                        <button style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', background: '#059669', color: '#fff', border: 'none', borderRadius: 4 }} onClick={() => handleMarcarPago(boleto.id)}>Baixa</button>
                                        <button style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }} onClick={() => handleModificarValor(boleto.id, boleto.amount)}>Valor</button>
                                        <button style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }} onClick={() => handleAdicionarDesconto(boleto.id, boleto.discount)}>Desconto</button>
                                    </>}

                                    {boleto.status !== 'Pago' && boleto.status !== 'Estornado' && <button style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem' }} onClick={() => handleGerarPix(boleto.id)}>PIX</button>}
                                    
                                    {boleto.status === 'Pago' && <button style={{ fontSize: '0.75rem', padding: '0.2rem 0.4rem', background: '#b91c1c', color: '#fff', border: 'none', borderRadius: 4 }} onClick={() => handleEstornar(boleto.id)}>Estornar</button>}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {boletos.length === 0 && (
                        <tr>
                            <td colSpan={5} style={{ padding: '1.5rem', textAlign: 'center', color: '#94a3b8' }}>
                                Nenhum boleto encontrado para este cliente.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
