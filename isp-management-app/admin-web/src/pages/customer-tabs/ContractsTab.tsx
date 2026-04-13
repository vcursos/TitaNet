import React from 'react';

interface ContractsTabProps {
    customerId: string;
    contractNumber?: string;
}

export const ContractsTab: React.FC<ContractsTabProps> = ({ customerId, contractNumber }) => {
    const handleSendContract = () => {
        alert('Contrato enviado para o cliente com sucesso via Email/WhatsApp!');
    };

    return (
        <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div>
                    <h4 style={{ margin: '0 0 0.25rem', color: '#0f172a' }}>Contrato Atual ({contractNumber || 'N/A'})</h4>
                    <p style={{ margin: 0, color: '#475569', fontSize: '0.85rem' }}>Assinado digitalmente. Este é o contrato principal de prestação de serviço multimídia (SCM).</p>
                </div>
                <button onClick={handleSendContract} style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Enviar Contrato para Cliente</button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
                <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Tipo de Contrato</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Data de Emissão</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Status</th>
                        <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem' }}>Termo de Adesão (Internet)</td>
                        <td style={{ padding: '0.75rem' }}>01/04/2026</td>
                        <td style={{ padding: '0.75rem' }}>
                            <span style={{ padding: '0.15rem 0.4rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#166534' }}>Assinado</span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                            <button style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Visualizar PDF</button>
                        </td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.75rem' }}>Comodato de Equipamentos</td>
                        <td style={{ padding: '0.75rem' }}>01/04/2026</td>
                        <td style={{ padding: '0.75rem' }}>
                            <span style={{ padding: '0.15rem 0.4rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: '#dcfce7', color: '#166534' }}>Assinado</span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                            <button style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>Visualizar PDF</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
