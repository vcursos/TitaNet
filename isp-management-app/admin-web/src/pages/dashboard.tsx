import React, { useEffect, useState } from 'react';
import { DashboardMetric, fetchDashboard } from '../api/dashboard';

const Dashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
    const [pendingActions, setPendingActions] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchDashboard();
                setMetrics(data.metrics);
                setPendingActions(data.pendingActions);
            } catch (err) {
                setError('Não foi possível carregar o dashboard.');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    return (
        <div style={{ padding: '1rem 1.25rem' }}>
            <h1 style={{ marginBottom: '0.25rem' }}>Dashboard</h1>
            <p style={{ marginTop: 0, color: '#475569' }}>
                Visão operacional rápida do provedor para tomada de decisão diária.
            </p>

            {loading && <p>Carregando métricas...</p>}
            {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

            <section
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '0.85rem',
                    marginTop: '1rem',
                }}
            >
                {!loading && metrics.map((metric) => (
                    <article
                        key={metric.label}
                        style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1rem' }}
                    >
                        <small style={{ color: '#64748b' }}>{metric.label}</small>
                        <h2 style={{ margin: '0.4rem 0 0.2rem', fontSize: '1.4rem' }}>{metric.value}</h2>
                        <small style={{ color: '#0f766e' }}>{metric.hint}</small>
                    </article>
                ))}
            </section>

            <section
                style={{
                    marginTop: '1rem',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '1rem',
                }}
            >
                <h3 style={{ marginTop: 0 }}>Pendências prioritárias</h3>
                <ul style={{ marginBottom: 0 }}>
                    {!loading && pendingActions.map((action) => (
                        <li key={action} style={{ marginBottom: '0.5rem' }}>
                            {action}
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
};

export default Dashboard;