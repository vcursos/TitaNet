import { getWithFallback } from './http';

export interface DashboardMetric {
  label: string;
  value: string;
  hint: string;
}

export interface DashboardPayload {
  metrics: DashboardMetric[];
  pendingActions: string[];
}

const payload: DashboardPayload = {
  metrics: [
    { label: 'Clientes ativos', value: '1.248', hint: '+12 no mês' },
    { label: 'OS em aberto', value: '37', hint: '11 críticas' },
    { label: 'Boletos pendentes', value: 'R$ 84.320', hint: 'venc. em 7 dias' },
    { label: 'Uptime da rede', value: '99,83%', hint: 'últimos 30 dias' },
  ],
  pendingActions: [
    'Aprovar 4 novos logins de técnicos',
    'Revisar 8 clientes com atraso > 30 dias',
    'Validar migração de base antiga (lote #03)',
  ],
};

export const fetchDashboard = async (): Promise<DashboardPayload> => {
  return getWithFallback('/dashboard', () => payload, 200);
};
