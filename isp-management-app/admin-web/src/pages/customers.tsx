import React, { useEffect, useMemo, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import {
    createCustomer,
    CreateCustomerInput,
    Customer,
    CustomerStatus,
    fetchCustomerById,
    fetchCustomers,
    PaymentStatus,
    updateCustomer,
    UpdateCustomerInput,
    EmailItem,
    PhoneItem,
    LoanedDevice,
    CustomerType,
} from '../api/customers';
import {
    CustomerConnectivityLevel,
    CustomerConnectivityStatus,
    fetchCustomerConnectivityStatuses,
    fetchMikrotikIp,
    fetchOnuTelemetry,
    fetchProviderSettings,
    ProviderSettings,
} from '../api/provider-config';
import { BillingTab, FiscalTab, ContractsTab } from './customer-tabs';

type FormMode = 'create' | 'edit';
type Tab = 'cadastro' | 'financeiro' | 'fiscal' | 'contratos';

interface CustomerFormState {
    name: string;
    customerType: CustomerType;
    document: string;
    contractNumber: string;
    emails: EmailItem[];
    phones: PhoneItem[];
    address: string;
    neighborhood: string;
    city: string;
    plan: string;
    status: CustomerStatus;
    monthlyFee: string;
    balanceDue: string;
    lastPaymentDate: string;
    paymentStatus: PaymentStatus;
    olt: string;
    ponPort: string;
    onuSerial: string;
    onuModel: string;
    rxPowerDbm: string;
    txPowerDbm: string;
    ipv4: string;
    latitude: string;
    longitude: string;
    paymentGateway: string;
    tvPlan: string;
    loanedDevices: LoanedDevice[];
}

const emptyForm: CustomerFormState = {
    name: '',
    customerType: 'PF',
    document: '',
    contractNumber: '',
    emails: [{ address: '', isMain: true }],
    phones: [{ number: '', isMain: true }],
    address: '',
    neighborhood: '',
    city: '',
    plan: '',
    status: 'Pré-cadastro',
    monthlyFee: '0',
    balanceDue: '0',
    lastPaymentDate: new Date().toISOString().slice(0, 10),
    paymentStatus: 'Em dia',
    olt: '',
    ponPort: '',
    onuSerial: '',
    onuModel: '',
    rxPowerDbm: '-20',
    txPowerDbm: '2',
    ipv4: '',
    latitude: '',
    longitude: '',
    paymentGateway: 'gerencianet',
    tvPlan: '',
    loanedDevices: [],
};

const toCustomerForm = (customer: Customer): CustomerFormState => ({
    name: customer.name,
    customerType: customer.customerType || 'PF',
    document: customer.document || '',
    contractNumber: customer.contractNumber || '',
    emails: customer.emails && customer.emails.length > 0 ? customer.emails : [{ address: '', isMain: true }],
    phones: customer.phones && customer.phones.length > 0 ? customer.phones : [{ number: '', isMain: true }],
    address: customer.address,
    neighborhood: customer.neighborhood,
    city: customer.city,
    plan: customer.plan,
    status: customer.status,
    monthlyFee: String(customer.financial.monthlyFee),
    balanceDue: String(customer.financial.balanceDue),
    lastPaymentDate: customer.financial.lastPaymentDate,
    paymentStatus: customer.financial.paymentStatus,
    olt: customer.connection.olt,
    ponPort: customer.connection.ponPort,
    onuSerial: customer.connection.onuSerial,
    onuModel: customer.connection.onuModel,
    rxPowerDbm: String(customer.connection.rxPowerDbm),
    txPowerDbm: String(customer.connection.txPowerDbm),
    ipv4: customer.connection.ipv4,
    latitude: customer.connection.latitude || '',
    longitude: customer.connection.longitude || '',
    paymentGateway: 'gerencianet', 
    tvPlan: customer.tvPlan || '',
    loanedDevices: customer.loanedDevices || [],
});

const parseNumberSafe = (value: string): number => {
    const parsed = Number(value.replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : 0;
};

const toCreatePayload = (form: CustomerFormState): CreateCustomerInput => ({
    name: form.name,
    customerType: form.customerType,
    document: form.document,
    emails: form.emails,
    phones: form.phones,
    address: form.address,
    neighborhood: form.neighborhood,
    city: form.city,
    plan: form.plan,
    tvPlan: form.tvPlan,
    loanedDevices: form.loanedDevices,
    status: form.status,
    financial: {
        monthlyFee: parseNumberSafe(form.monthlyFee),
        balanceDue: parseNumberSafe(form.balanceDue),
        lastPaymentDate: form.lastPaymentDate,
        paymentStatus: form.paymentStatus,
    },
    connection: {
        olt: form.olt,
        ponPort: form.ponPort,
        onuSerial: form.onuSerial,
        onuModel: form.onuModel,
        rxPowerDbm: parseNumberSafe(form.rxPowerDbm),
        txPowerDbm: parseNumberSafe(form.txPowerDbm),
        ipv4: form.ipv4,
        latitude: form.latitude,
        longitude: form.longitude,
    },
});

const toUpdatePayload = (form: CustomerFormState): UpdateCustomerInput => toCreatePayload(form);

const STATUS_STYLES: Record<CustomerConnectivityLevel, { label: string; color: string; bg: string }> = {
    online: { label: 'Online', color: '#15803d', bg: '#dcfce7' },
    offline: { label: 'Offline', color: '#b91c1c', bg: '#fee2e2' },
    warning: { label: 'Sinal alto', color: '#a16207', bg: '#fef9c3' },
};

const CustomersV3: React.FC = () => {
    const history = useHistory();
    const location = useLocation();

    const editRouteMatch = useMemo(
        () => location.pathname.match(/^\/customers\/edit\/([^/]+)$/),
        [location.pathname],
    );

    const editingId = editRouteMatch ? decodeURIComponent(editRouteMatch[1]) : null;
    const isCreateRoute = location.pathname === '/customers/new';
    const isEditRoute = Boolean(editingId);
    const isEditorRoute = isCreateRoute || isEditRoute;

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [providerSettings, setProviderSettings] = useState<ProviderSettings | null>(null);

    const [loading, setLoading] = useState<boolean>(true);
    const [settingsLoading, setSettingsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [search, setSearch] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);

    const [detailsLoading, setDetailsLoading] = useState<boolean>(false);
    const [quickViewCustomer, setQuickViewCustomer] = useState<Customer | null>(null);
    const [showQuickView, setShowQuickView] = useState<boolean>(false);
    const [connectivityByCustomer, setConnectivityByCustomer] = useState<Record<string, CustomerConnectivityStatus>>({});

    const [formMode, setFormMode] = useState<FormMode>('create');
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState<CustomerFormState>(emptyForm);
    const [saving, setSaving] = useState<boolean>(false);
    const [syncingNetworkData, setSyncingNetworkData] = useState<boolean>(false);
    const [editorConnectivity, setEditorConnectivity] = useState<CustomerConnectivityLevel>('online');
    const [activeTab, setActiveTab] = useState<Tab>('cadastro');

    const pageSize = 6;

    useEffect(() => {
        const loadCustomers = async () => {
            try {
                const list = await fetchCustomers();
                setCustomers(list);
            } catch (err) {
                setError('Falha ao carregar clientes.');
            } finally {
                setLoading(false);
            }
        };

        loadCustomers();
    }, []);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await fetchProviderSettings();
                setProviderSettings(settings);
            } catch (err) {
                setError('Falha ao carregar configurações do provedor.');
            } finally {
                setSettingsLoading(false);
            }
        };

        loadSettings();
    }, []);

    useEffect(() => {
        if (!providerSettings || customers.length === 0) return;

        const loadConnectivity = async () => {
            const statuses = await fetchCustomerConnectivityStatuses(
                customers.map((customer) => ({ id: customer.id, rxPowerDbm: customer.connection.rxPowerDbm })),
                providerSettings.signalLimits,
            );
            setConnectivityByCustomer(statuses);
        };

        loadConnectivity();
    }, [customers, providerSettings]);

    useEffect(() => {
        if (!successMessage) return;

        const timer = window.setTimeout(() => setSuccessMessage(null), 2500);
        return () => window.clearTimeout(timer);
    }, [successMessage]);

    useEffect(() => {
        if (!isEditorRoute) {
            setFormMode('create');
            setEditingCustomer(null);
            setFormData(emptyForm);
            return;
        }

        if (isCreateRoute) {
            setFormMode('create');
            setEditingCustomer(null);
            setFormData(emptyForm);
            return;
        }

        if (!editingId) {
            setError('Cliente inválido para edição.');
            history.replace('/customers');
            return;
        }

        const loadForEdit = async () => {
            setDetailsLoading(true);
            setError(null);

            try {
                const customer = await fetchCustomerById(editingId);
                if (!customer) {
                    setError('Cliente não encontrado para edição.');
                    history.replace('/customers');
                    return;
                }

                setFormMode('edit');
                setEditingCustomer(customer);
                setFormData(toCustomerForm(customer));
            } catch (err) {
                setError('Falha ao carregar cliente para edição.');
            } finally {
                setDetailsLoading(false);
            }
        };

        loadForEdit();
    }, [editingId, history, isCreateRoute, isEditorRoute]);

    const filteredCustomers = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return customers;

        return customers.filter(
            (customer) =>
                customer.name.toLowerCase().includes(term)
                || customer.emails.some(e => e.address.toLowerCase().includes(term))
                || customer.plan.toLowerCase().includes(term)
                || customer.phones.some(p => p.number.toLowerCase().includes(term))
                || customer.connection.onuSerial.toLowerCase().includes(term),
        );
    }, [customers, search]);

    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    const paginatedCustomers = filteredCustomers.slice(start, start + pageSize);

    const plans = providerSettings?.plans ?? [];
    const olts = providerSettings?.olts ?? [];
    const selectedOlt = olts.find((olt) => olt.id === formData.olt);
    const selectedPlan = plans.find((plan) => plan.name === formData.plan);

    const resolveConnectivity = (customer: Customer): CustomerConnectivityStatus => {
        const known = connectivityByCustomer[customer.id];
        if (known) return known;

        if (providerSettings && customer.connection.rxPowerDbm >= providerSettings.signalLimits.warningRxAboveDbm) {
            return { online: true, rxPowerDbm: customer.connection.rxPowerDbm, level: 'warning' };
        }

        return { online: true, rxPowerDbm: customer.connection.rxPowerDbm, level: 'online' };
    };

    const handlePrev = () => setCurrentPage((prev) => Math.max(1, prev - 1));
    const handleNext = () => setCurrentPage((prev) => Math.min(totalPages, prev + 1));

    const handleFormChange = (field: keyof CustomerFormState, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handlePlanChange = (planName: string) => {
        const plan = plans.find((entry) => entry.name === planName);
        setFormData((prev) => ({
            ...prev,
            plan: planName,
            monthlyFee: plan ? String(plan.monthlyFee) : prev.monthlyFee,
        }));
    };

    const handleOltChange = (oltId: string) => {
        setFormData((prev) => ({
            ...prev,
            olt: oltId,
            ponPort: '',
            onuSerial: '',
            onuModel: '',
            rxPowerDbm: '',
            txPowerDbm: '',
            ipv4: '',
        }));
    };

    const syncNetworkData = async (oltId: string, ponPort: string) => {
        if (!providerSettings || !oltId || !ponPort) return;

        setSyncingNetworkData(true);
        try {
            const telemetry = await fetchOnuTelemetry(oltId, ponPort);
            const leaseIp = await fetchMikrotikIp(oltId, ponPort, telemetry.onuSerial);

            const level: CustomerConnectivityLevel = !telemetry.online
                ? 'offline'
                : telemetry.rxPowerDbm >= providerSettings.signalLimits.warningRxAboveDbm
                    ? 'warning'
                    : 'online';

            setEditorConnectivity(level);
            setFormData((prev) => ({
                ...prev,
                olt: oltId,
                ponPort,
                onuSerial: telemetry.onuSerial,
                onuModel: telemetry.onuModel,
                rxPowerDbm: String(telemetry.rxPowerDbm),
                txPowerDbm: String(telemetry.txPowerDbm),
                ipv4: leaseIp,
            }));
        } catch (err) {
            setError('Falha ao sincronizar ONU/IP via APIs de rede.');
        } finally {
            setSyncingNetworkData(false);
        }
    };

    useEffect(() => {
        if (!isEditorRoute || !formData.olt || !formData.ponPort) return;
        syncNetworkData(formData.olt, formData.ponPort);
    }, [formData.olt, formData.ponPort, isEditorRoute]);

    const openCreatePage = () => history.push('/customers/new');
    const openEditPage = (id: string) => history.push(`/customers/edit/${encodeURIComponent(id)}`);

    const openQuickView = async (id: string) => {
        setDetailsLoading(true);
        setError(null);
        setShowQuickView(true);

        try {
            const customer = await fetchCustomerById(id);
            if (!customer) {
                setError('Cliente não encontrado para visualização.');
                setShowQuickView(false);
                return;
            }

            setQuickViewCustomer(customer);
        } catch (err) {
            setError('Falha ao carregar detalhes do cliente.');
            setShowQuickView(false);
        } finally {
            setDetailsLoading(false);
        }
    };

    const closeQuickView = () => {
        setShowQuickView(false);
        setQuickViewCustomer(null);
    };

    const reloadCustomers = async () => {
        const list = await fetchCustomers();
        setCustomers(list);
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        if (!formData.name.trim() || !formData.emails[0]?.address.trim() || !formData.phones[0]?.number.trim() || !formData.plan.trim()) {
            setError('Preencha nome, email (pelo menos um), telefone (pelo menos um) e plano para salvar o cliente.');
            return;
        }

        if (!formData.onuSerial.trim() || !formData.olt.trim() || !formData.ponPort.trim()) {
            setError('Selecione OLT/PON para carregar ONU e IP automaticamente antes de salvar.');
            return;
        }

        setSaving(true);
        try {
            if (formMode === 'create') {
                await createCustomer(toCreatePayload(formData));
                setSuccessMessage('Cliente adicionado com sucesso.');
            } else if (editingCustomer) {
                const updated = await updateCustomer(editingCustomer.id, toUpdatePayload(formData));
                if (!updated) {
                    setError('Não foi possível atualizar este cliente.');
                    return;
                }
                setSuccessMessage('Cliente atualizado com sucesso.');
            }

            await reloadCustomers();
            history.push('/customers');
        } catch (err) {
            setError('Falha ao salvar cliente.');
        } finally {
            setSaving(false);
        }
    };

    const statusBadge = (level: CustomerConnectivityLevel) => {
        const palette = STATUS_STYLES[level];
        return (
            <span
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '0.2rem 0.45rem',
                    borderRadius: 999,
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: palette.color,
                    background: palette.bg,
                }}
            >
                <span style={{ fontSize: '0.65rem' }}>●</span>
                {palette.label}
            </span>
        );
    };

    if (isEditorRoute) {
        return (
            <div style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <div>
                        <h1 style={{ marginBottom: '0.2rem' }}>{formMode === 'create' ? 'Novo cliente' : 'Editar cliente'}</h1>
                        <p style={{ marginTop: 0, color: '#64748b' }}>
                            Plano/mensalidade e OLT/PON agora usam catálogo da configuração do provedor.
                        </p>
                    </div>
                    <button type="button" onClick={() => history.push('/customers')}>Voltar para listagem</button>
                </div>

                {settingsLoading && <p>Carregando catálogos do provedor...</p>}
                {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
                {detailsLoading && <p>Carregando dados do cliente...</p>}

                {!detailsLoading && (
                    <>
                        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                            <button onClick={() => setActiveTab('cadastro')} style={{ background: activeTab === 'cadastro' ? '#fff' : 'transparent', border: 'none', padding: '0.5rem 1rem', borderBottom: activeTab === 'cadastro' ? '2px solid #0f766e' : '2px solid transparent' }}>Dados Cadastrais</button>
                            <button onClick={() => setActiveTab('financeiro')} style={{ background: activeTab === 'financeiro' ? '#fff' : 'transparent', border: 'none', padding: '0.5rem 1rem', borderBottom: activeTab === 'financeiro' ? '2px solid #0f766e' : '2px solid transparent' }} disabled={formMode === 'create'}>Boletos</button>
                            <button onClick={() => setActiveTab('fiscal')} style={{ background: activeTab === 'fiscal' ? '#fff' : 'transparent', border: 'none', padding: '0.5rem 1rem', borderBottom: activeTab === 'fiscal' ? '2px solid #0f766e' : '2px solid transparent' }} disabled={formMode === 'create'}>Notas Fiscais</button>
                            <button onClick={() => setActiveTab('contratos')} style={{ background: activeTab === 'contratos' ? '#fff' : 'transparent', border: 'none', padding: '0.5rem 1rem', borderBottom: activeTab === 'contratos' ? '2px solid #0f766e' : '2px solid transparent' }} disabled={formMode === 'create'}>Contratos</button>
                        </div>

                        {activeTab === 'cadastro' && (
                            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
                                
                                <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.5rem', display: 'grid', gap: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Dados Pessoais e Endereço</h3>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
                                        <label>
                                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Nome completo / Razão Social</div>
                                            <input style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.name} onChange={(e) => handleFormChange('name', e.target.value)} />
                                        </label>
                                        <label>
                                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Status do Cadastro (CRM)</div>
                                            <select style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.status} onChange={(e) => handleFormChange('status', e.target.value)}>
                                                <option value="Pré-cadastro">Pré-cadastro</option>
                                                <option value="Ativo">Ativo</option>
                                                <option value="Suspenso">Suspenso</option>
                                            </select>
                                        </label>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: '1rem' }}>
                                        <label>
                                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Tipo Cliente</div>
                                            <select style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.customerType} onChange={(e) => handleFormChange('customerType', e.target.value as any)}>
                                                <option value="PF">Pessoa Física - PF</option>
                                                <option value="PJ">Pessoa Jurídica - PJ</option>
                                                <option value="Estrangeiro">Estrangeiro</option>
                                            </select>
                                        </label>
                                        <label>
                                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>{formData.customerType === 'PF' ? 'CPF' : formData.customerType === 'PJ' ? 'CNPJ' : 'Documento (Passaporte, etc)'}</div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <input style={{ flex: 1, padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.document} onChange={(e) => handleFormChange('document', e.target.value)} />
                                                <button type="button" style={{ padding: '0.5rem 1rem', background: '#0ea5e9', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }} onClick={() => alert('Consulta em mock BoaVista/Serasa: O documento encontra-se regular.')}>Verificar Negativado</button>
                                            </div>
                                        </label>
                                    </div>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <label>
                                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Email</div>
                                            {formData.emails.map((emailItem, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <input type="email" style={{ flex: 1, padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={emailItem.address} onChange={(e) => {
                                                        const newEmails = [...formData.emails];
                                                        newEmails[idx].address = e.target.value;
                                                        handleFormChange('emails', newEmails);
                                                    }} />
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => handleFormChange('emails', [...formData.emails, { address: '', isMain: false }])} style={{ padding: '0.3rem 0.6rem', border: '1px dashed #cbd5e1', borderRadius: 4, background: '#f8fafc', color: '#475569', cursor: 'pointer' }}>+ Add Email</button>
                                        </label>
                                        <label>
                                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Telefone</div>
                                            {formData.phones.map((phoneItem, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <input style={{ flex: 1, padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={phoneItem.number} onChange={(e) => {
                                                        const newPhones = [...formData.phones];
                                                        newPhones[idx].number = e.target.value;
                                                        handleFormChange('phones', newPhones);
                                                    }} />
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => handleFormChange('phones', [...formData.phones, { number: '', isMain: false }])} style={{ padding: '0.3rem 0.6rem', border: '1px dashed #cbd5e1', borderRadius: 4, background: '#f8fafc', color: '#475569', cursor: 'pointer' }}>+ Add Telefone</button>
                                        </label>
                                    </div>
                                    
                                    <label>
                                        <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Endereço</div>
                                        <input style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.address} onChange={(e) => handleFormChange('address', e.target.value)} />
                                    </label>
                                    
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <label>
                                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Bairro</div>
                                            <input style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.neighborhood} onChange={(e) => handleFormChange('neighborhood', e.target.value)} />
                                        </label>
                                        <label>
                                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Cidade</div>
                                            <input style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.city} onChange={(e) => handleFormChange('city', e.target.value)} />
                                        </label>
                                    </div>
                                    
                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
                                        <h4 style={{ margin: '0 0 0.75rem', color: '#0f172a' }}>Planos e Mensalidade</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.5fr) minmax(0, 1fr)', gap: '1rem' }}>
                                            <label>
                                                <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Plano de Internet</div>
                                                <select style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.plan} onChange={(e) => handlePlanChange(e.target.value)}>
                                                    <option value="">Selecione um plano</option>
                                                    {plans.map((plan) => (
                                                        <option key={plan.id} value={plan.name}>
                                                            {plan.name} ({plan.marketingName})
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Plano de TV</div>
                                                <select style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.tvPlan} onChange={(e) => handleFormChange('tvPlan', e.target.value)}>
                                                    <option value="">Nenhum</option>
                                                    <option value="basico">TV Básico (40 canais)</option>
                                                    <option value="familia">TV Família (80 canais)</option>
                                                    <option value="premium">TV Premium (150+ canais)</option>
                                                </select>
                                            </label>
                                            <label>
                                                <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Mensalidade (R$)</div>
                                                <input style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff' }} value={formData.monthlyFee} onChange={(e) => handleFormChange('monthlyFee', e.target.value)} />
                                            </label>
                                        </div>
                                    </div>

                                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                                        <h4 style={{ margin: '0 0 0.75rem', color: '#0f172a' }}>Preferências de Pagamento / Extras</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                                            <label>
                                                <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Gateway de Pagamento</div>
                                                <select style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.paymentGateway} onChange={(e) => handleFormChange('paymentGateway', e.target.value)}>
                                                    <option value="gerencianet">Gerencianet / Efí</option>
                                                    <option value="asaas">Asaas</option>
                                                    <option value="juno">Juno</option>
                                                    <option value="galaxpay">Galax Pay</option>
                                                </select>
                                            </label>
                                        </div>
                                        <label style={{ display: 'block', marginTop: '1rem' }}>
                                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Equipamentos em Comodato</div>
                                            {formData.loanedDevices.map((device, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                    <input style={{ flex: 1, padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} placeholder="Ex: Roteador TP-Link AC1200, ONU Huawei" value={device.name} onChange={(e) => {
                                                        const newDevices = [...formData.loanedDevices];
                                                        newDevices[idx].name = e.target.value;
                                                        handleFormChange('loanedDevices', newDevices);
                                                    }} />
                                                </div>
                                            ))}
                                            <button type="button" onClick={() => handleFormChange('loanedDevices', [...formData.loanedDevices, { name: '' }])} style={{ padding: '0.3rem 0.6rem', border: '1px dashed #cbd5e1', borderRadius: 4, background: '#f8fafc', color: '#475569', cursor: 'pointer' }}>+ Add Equipamento</button>
                                        </label>
                                    </div>
                                </section>

                                <section style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.5rem', display: 'grid', gap: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>Conexão e ONU</h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: '#f8fafc', padding: '0.4rem 0.8rem', borderRadius: 999, border: '1px solid #e2e8f0' }}>
                                            <span style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600 }}>Status do Equipamento:</span>
                                            {statusBadge(editorConnectivity)}
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                                        <label>
                                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Latitude</div>
                                            <input style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} placeholder="Ex: -23.550520" value={formData.latitude} onChange={(e) => handleFormChange('latitude', e.target.value)} />
                                        </label>
                                        <label>
                                            <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Longitude</div>
                                            <input style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} placeholder="Ex: -46.633308" value={formData.longitude} onChange={(e) => handleFormChange('longitude', e.target.value)} />
                                        </label>
                                    </div>

                                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: 8, display: 'grid', gap: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <label>
                                                <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>OLT Destino</div>
                                                <select style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.olt} onChange={(e) => handleOltChange(e.target.value)}>
                                                    <option value="">Selecione a OLT</option>
                                                    {olts.map((olt) => (
                                                        <option key={olt.id} value={olt.id}>{olt.name} ({olt.id})</option>
                                                    ))}
                                                </select>
                                            </label>
                                            <label>
                                                <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>PON / Porta</div>
                                                <select style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.ponPort} onChange={(e) => handleFormChange('ponPort', e.target.value)} disabled={!formData.olt}>
                                                    <option value="">Selecione a PON</option>
                                                    {(selectedOlt?.pons ?? []).map((pon) => (
                                                        <option key={pon} value={pon}>{pon}</option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <small style={{ color: '#64748b' }}>
                                                A telemetria (Sinal, MAC, IP) é carregada automaticamente ao definir a OLT/PON.
                                            </small>
                                            {syncingNetworkData && <small style={{ color: '#0ea5e9', fontWeight: 600 }}>Sincronizando com OLT...</small>}
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <label><div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Serial ONU</div><input style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.onuSerial} readOnly /></label>
                                            <label><div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Modelo ONU</div><input style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.onuModel} readOnly /></label>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <label><div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Potência Rx (dBm)</div><input style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.rxPowerDbm} readOnly /></label>
                                            <label><div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>Potência Tx (dBm)</div><input style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.txPowerDbm} readOnly /></label>
                                        </div>
                                        <label><div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>IP (MikroTik)</div><input style={{ width: '100%', padding: '0.5rem', borderRadius: 6, border: '1px solid #cbd5e1' }} value={formData.ipv4} readOnly /></label>
                                    </div>
                                </section>

                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                    <button type="submit" disabled={saving || syncingNetworkData}>{saving ? 'Salvando...' : formMode === 'create' ? 'Adicionar cliente' : 'Salvar edição'}</button>
                                    <button type="button" onClick={() => history.push('/customers')}>Cancelar</button>
                                </div>
                            </form>
                        )}
                        {activeTab === 'financeiro' && editingCustomer && <BillingTab customerId={editingCustomer.id} />}
                        {activeTab === 'fiscal' && editingCustomer && <FiscalTab customerId={editingCustomer.id} />}
                        {activeTab === 'contratos' && editingCustomer && <ContractsTab customerId={editingCustomer.id} contractNumber={formData.contractNumber} />}
                    </>
                )}
            </div>
        );
    }

    return (
        <div style={{ padding: '1rem 1.25rem' }}>
            <h1>Clientes</h1>
            <p style={{ color: '#475569' }}>
                Visualização rápida em modal, edição em página separada e monitoramento visual de conectividade (verde/vermelho/amarelo).
            </p>
            {loading && <p>Carregando clientes...</p>}
            {settingsLoading && <p>Carregando parâmetros de rede...</p>}
            {error && <p style={{ color: '#b91c1c' }}>{error}</p>}
            {successMessage && <p style={{ color: '#0f766e' }}>{successMessage}</p>}

            <div style={{ marginBottom: '0.8rem' }}>
                <button onClick={openCreatePage}>+ Novo cliente</button>
            </div>

            <div style={{ marginBottom: '0.8rem' }}>
                <input
                    type="text"
                    placeholder="Buscar por nome, email ou plano..."
                    value={search}
                    onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                    }}
                    style={{ width: '100%', maxWidth: 420, padding: '0.5rem 0.65rem', border: '1px solid #cbd5e1', borderRadius: 8 }}
                />
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', border: '1px solid #e2e8f0' }}>
                <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>Plano</th>
                        <th>Conectividade</th>
                        <th>Financeiro</th>
                        <th>ONU/Rx</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {!loading && paginatedCustomers.map((customer) => {
                        const connectivity = resolveConnectivity(customer);
                        return (
                            <tr key={customer.id}>
                                <td style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0' }}>{customer.id}</td>
                                <td style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: customer.status === 'Pré-cadastro' ? '#d97706' : customer.status === 'Ativo' ? '#15803d' : '#b91c1c', fontWeight: 700 }}>
                                        {customer.status}
                                    </div>
                                    <div style={{ fontWeight: 600 }}>{customer.name}</div>
                                    <small style={{ color: '#64748b' }}>{customer.emails?.[0]?.address}</small>
                                </td>
                                <td style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0' }}>{customer.plan}</td>
                                <td style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0' }}>{statusBadge(connectivity.level)}</td>
                                <td style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0' }}>{customer.financial.paymentStatus} • R$ {customer.financial.balanceDue.toFixed(2)}</td>
                                <td style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0' }}>{customer.connection.onuSerial} • {customer.connection.rxPowerDbm.toFixed(1)} dBm</td>
                                <td style={{ padding: '0.5rem', borderTop: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                                        <button onClick={() => openQuickView(customer.id)}>Ver rápido</button>
                                        <button onClick={() => openEditPage(customer.id)}>Editar</button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {paginatedCustomers.length === 0 && (
                        <tr>
                            <td style={{ padding: '0.75rem', textAlign: 'center', borderTop: '1px solid #e2e8f0' }} colSpan={7}>
                                Nenhum cliente encontrado.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div style={{ marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button onClick={handlePrev} disabled={safePage === 1}>Anterior</button>
                <span>Página {safePage} de {totalPages}</span>
                <button onClick={handleNext} disabled={safePage === totalPages}>Próxima</button>
                <small style={{ color: '#64748b' }}>{filteredCustomers.length} cliente(s) filtrado(s)</small>
            </div>

            {showQuickView && (
                <div
                    role="dialog"
                    aria-modal="true"
                    style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 1200 }}
                    onClick={closeQuickView}
                >
                    <div
                        style={{ width: '100%', maxWidth: 760, maxHeight: '88vh', overflowY: 'auto', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', padding: '1rem', boxShadow: '0 18px 45px rgba(15, 23, 42, 0.24)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.8rem' }}>
                            <h3 style={{ margin: 0 }}>Visualização rápida do cliente</h3>
                            <button type="button" onClick={closeQuickView}>Fechar</button>
                        </div>

                        {detailsLoading && <p style={{ marginTop: '0.75rem' }}>Carregando detalhes...</p>}
                        {!detailsLoading && !quickViewCustomer && <p style={{ marginTop: '0.75rem', color: '#64748b' }}>Não foi possível carregar os dados deste cliente.</p>}

                        {!detailsLoading && quickViewCustomer && (
                            <div style={{ display: 'grid', gap: '0.8rem', marginTop: '0.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: quickViewCustomer.status === 'Pré-cadastro' ? '#d97706' : quickViewCustomer.status === 'Ativo' ? '#15803d' : '#b91c1c', fontWeight: 700 }}>
                                            {quickViewCustomer.status}
                                        </div>
                                        <strong>{quickViewCustomer.name}</strong>
                                        <div>{quickViewCustomer.emails?.[0]?.address}</div>
                                        <div>{quickViewCustomer.phones?.[0]?.number}</div>
                                    </div>
                                    {statusBadge(resolveConnectivity(quickViewCustomer).level)}
                                </div>

                                <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.6rem' }}>
                                    <h4 style={{ margin: '0 0 0.3rem' }}>Financeiro</h4>
                                    <div><strong>Mensalidade:</strong> R$ {quickViewCustomer.financial.monthlyFee.toFixed(2)}</div>
                                    <div><strong>Saldo em aberto:</strong> R$ {quickViewCustomer.financial.balanceDue.toFixed(2)}</div>
                                    <div><strong>Status:</strong> {quickViewCustomer.financial.paymentStatus}</div>
                                </section>

                                <section style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.6rem' }}>
                                    <h4 style={{ margin: '0 0 0.3rem' }}>Conexão / ONU</h4>
                                    <div><strong>OLT/PON:</strong> {quickViewCustomer.connection.olt} • {quickViewCustomer.connection.ponPort}</div>
                                    <div><strong>ONU:</strong> {quickViewCustomer.connection.onuSerial} ({quickViewCustomer.connection.onuModel})</div>
                                    <div><strong>Rx/Tx:</strong> {quickViewCustomer.connection.rxPowerDbm.toFixed(1)} dBm • {quickViewCustomer.connection.txPowerDbm.toFixed(1)} dBm</div>
                                    <div><strong>IPv4:</strong> {quickViewCustomer.connection.ipv4}</div>
                                </section>

                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => openEditPage(quickViewCustomer.id)}>Ir para edição completa</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomersV3;
