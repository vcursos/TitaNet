import React, { useEffect, useState } from 'react';
import {
    CreateTechnicianInput,
    createTechnician,
    fetchTechnicians,
    Technician,
    toggleTechnicianAvailability,
} from '../api/technicians';

const Technicians: React.FC = () => {
    const [technicians, setTechnicians] = useState<Technician[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [name, setName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [region, setRegion] = useState<string>('Centro');

    useEffect(() => {
        const load = async () => {
            try {
                const list = await fetchTechnicians();
                setTechnicians(list);
            } catch (err) {
                setError('Falha ao carregar técnicos.');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, []);

    const handleAddTechnician = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const submit = async () => {
            const payload: CreateTechnicianInput = {
                name,
                email,
                region,
            };

            try {
                const created = await createTechnician(payload);
                setTechnicians((prev) => [created, ...prev]);
                setName('');
                setEmail('');
                setRegion('Centro');
            } catch (err) {
                setError('Falha ao cadastrar técnico.');
            }
        };

        if (!name.trim() || !email.trim()) {
            return;
        }

        submit();
    };

    const toggleAvailability = (id: string) => {
        const update = async () => {
            try {
                const updated = await toggleTechnicianAvailability(id);
                setTechnicians(updated);
            } catch (err) {
                setError('Falha ao atualizar status do técnico.');
            }
        };

        update();
    };

    return (
        <div style={{ padding: '1rem 1.25rem' }}>
            <h1>Técnicos</h1>
            <p style={{ color: '#475569' }}>Cadastro rápido local para simular o fluxo do painel admin.</p>
            {loading && <p>Carregando técnicos...</p>}
            {error && <p style={{ color: '#b91c1c' }}>{error}</p>}

            <form
                onSubmit={handleAddTechnician}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '0.65rem',
                    marginBottom: '1rem',
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: '0.85rem',
                }}
            >
                <input placeholder="Nome do técnico" value={name} onChange={(e) => setName(e.target.value)} />
                <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                <select value={region} onChange={(e) => setRegion(e.target.value)}>
                    <option>Centro</option>
                    <option>Zona Norte</option>
                    <option>Zona Sul</option>
                    <option>Zona Leste</option>
                    <option>Zona Oeste</option>
                </select>
                <button type="submit">Adicionar técnico</button>
            </form>

            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e2e8f0' }}>
                <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Região</th>
                        <th>Status</th>
                        <th>Ação</th>
                    </tr>
                </thead>
                <tbody>
                    {!loading && technicians.map((tech) => (
                        <tr key={tech.id}>
                            <td style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0' }}>{tech.id}</td>
                            <td style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0' }}>{tech.name}</td>
                            <td style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0' }}>{tech.email}</td>
                            <td style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0' }}>{tech.region}</td>
                            <td style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                                {tech.available ? 'Disponível' : 'Em atendimento'}
                            </td>
                            <td style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                                <button onClick={() => toggleAvailability(tech.id)}>
                                    Alternar status
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Technicians;