import React, { useState, useEffect } from 'react';
import { NotaFiscal, fetchNotasFiscaisByCustomerId, gerarNotaFiscal, enviarNotaFiscal } from '../../api/billing';
import { Boleto, fetchBoletosByCustomerId } from '../../api/billing';

interface FiscalTabProps {
    customerId: string;
}

export const FiscalTab: React.FC<FiscalTabProps> = ({ customerId }) => {
    const [notas, setNotas] = useState<NotaFiscal[]>([]);
    const [boletosPagos, setBoletosPagos] = useState<Boleto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedBoleto, setSelectedBoleto] = useState<string>('');

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [notasData, boletosData] = await Promise.all([
                fetchNotasFiscaisByCustomerId(customerId),
                fetchBoletosByCustomerId(customerId)
            ]);
            setNotas(notasData);
            setBoletosPagos(boletosData.filter(b => b.status === 'Pago'));
            if (boletosData.length > 0) {
                setSelectedBoleto(boletosData[0].id);
            }
        } catch (err) {
            setError('Falha ao carregar dados fiscais.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [customerId]);

    const handleGerarNota = async () => {
        if (!selectedBoleto) {
            setError('Selecione um boleto pago para gerar a nota fiscal.');
            return;
        }
        await gerarNotaFiscal(selectedBoleto);
        loadData();
    };

    const handleEnviarNota = async (notaId: string) => {
        await enviarNotaFiscal(notaId);
        loadData();
    };
    
    const handleEnviarTodasAutomatico = async () => {
        const pendentes = notas.filter(n => n.status === 'Pendente');
        for (const nota of pendentes) {
            await enviarNotaFiscal(nota.id);
        }
        loadData();
    };

    if (loading) return <p>Carregando notas fiscais...</p>;
    if (error) return <p style={{ color: '#b91c1c' }}>{error}</p>;

    return (
        <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap', background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <select value={selectedBoleto} onChange={e => setSelectedBoleto(e.target.value)} style={{ flexGrow: 1 }}>
                    <option value="">Selecione um boleto pago para gerar a nota</option>
                    {boletosPagos.map(b => (
                        <option key={b.id} value={b.id}>Boleto {b.id} - R$ {b.amount.toFixed(2)} (Pago em {new Date(b.dueDate).toLocaleDateString()})</option>
                    ))}
                </select>
                <button onClick={handleGerarNota} disabled={!selectedBoleto}>Gerar NF-e</button>
                <button onClick={handleEnviarTodasAutomatico}>Enviar Pendentes (Auto)</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e2e8f0' }}>
                <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ padding: '0.6rem', textAlign: 'left' }}>ID</th>
                        <th style={{ padding: '0.6rem', textAlign: 'left' }}>Boleto Origem</th>
                        <th style={{ padding: '0.6rem', textAlign: 'left' }}>Valor</th>
                        <th style={{ padding: '0.6rem', textAlign: 'left' }}>Emissão</th>
                        <th style={{ padding: '0.6rem', textAlign: 'left' }}>Status</th>
                        <th style={{ padding: '0.6rem', textAlign: 'left' }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {notas.map(nota => (
                        <tr key={nota.id}>
                            <td style={{ padding: '0.5rem 0.6rem', borderTop: '1px solid #e2e8f0' }}>{nota.id}</td>
                            <td style={{ padding: '0.5rem 0.6rem', borderTop: '1px solid #e2e8f0' }}>{nota.boletoId}</td>
                            <td style={{ padding: '0.5rem 0.6rem', borderTop: '1px solid #e2e8f0' }}>R$ {nota.amount.toFixed(2)}</td>
                            <td style={{ padding: '0.5rem 0.6rem', borderTop: '1px solid #e2e8f0' }}>{new Date(nota.emissionDate).toLocaleDateString()}</td>
                            <td style={{ padding: '0.5rem 0.6rem', borderTop: '1px solid #e2e8f0' }}>{nota.status}</td>
                            <td style={{ padding: '0.5rem 0.6rem', borderTop: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                    {nota.status === 'Pendente' && <button onClick={() => handleEnviarNota(nota.id)}>Enviar Manual</button>}
                                    {nota.nfseLink && <a href={nota.nfseLink} target="_blank" rel="noopener noreferrer" className="button-like">Ver NF-e</a>}
                                </div>
                            </td>
                        </tr>
                    ))}
                    {notas.length === 0 && (
                        <tr>
                            <td colSpan={6} style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', color: '#64748b' }}>
                                Nenhuma nota fiscal encontrada para este cliente.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};
