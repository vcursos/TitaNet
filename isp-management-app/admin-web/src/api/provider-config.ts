import { getWithFallback } from './http';

export interface ProviderPlan {
  id: string;
  name: string;
  monthlyFee: number;
  marketingName: string;
  invoiceRule: string;
}

export interface OltProfile {
  id: string;
  name: string;
  pons: string[];
  mikrotikHost: string;
}

export interface SignalLimits {
  warningRxAboveDbm: number;
  criticalRxBelowDbm: number;
}

export interface ProviderSettings {
  plans: ProviderPlan[];
  olts: OltProfile[];
  signalLimits: SignalLimits;
}

export interface OnuTelemetry {
  onuSerial: string;
  onuModel: string;
  rxPowerDbm: number;
  txPowerDbm: number;
  online: boolean;
}

export type CustomerConnectivityLevel = 'online' | 'offline' | 'warning';

export interface CustomerConnectivityStatus {
  online: boolean;
  rxPowerDbm: number;
  level: CustomerConnectivityLevel;
}

const providerSettings: ProviderSettings = {
  plans: [
    { id: 'p200', name: '200 Mega', monthlyFee: 89.9, marketingName: 'Start Fibra 200', invoiceRule: 'NF-PLANO-200' },
    { id: 'p400', name: '400 Mega', monthlyFee: 109.9, marketingName: 'Turbo Fibra 400', invoiceRule: 'NF-PLANO-400' },
    { id: 'p600', name: '600 Mega', monthlyFee: 139.9, marketingName: 'Ultra Fibra 600', invoiceRule: 'NF-PLANO-600' },
    { id: 'p1000', name: '1 Giga', monthlyFee: 199.9, marketingName: 'Giga Prime 1G', invoiceRule: 'NF-PLANO-1G' },
  ],
  olts: [
    { id: 'OLT-01', name: 'OLT Aracaju Centro', pons: ['PON 1/1', 'PON 1/2', 'PON 1/8'], mikrotikHost: 'mk-core-aju-01' },
    { id: 'OLT-02', name: 'OLT Aracaju Sul', pons: ['PON 2/1', 'PON 2/4', 'PON 2/8'], mikrotikHost: 'mk-core-aju-02' },
    { id: 'OLT-03', name: 'OLT Barra Coqueiros', pons: ['PON 3/2', 'PON 3/7', 'PON 3/8'], mikrotikHost: 'mk-core-barra-01' },
  ],
  signalLimits: {
    warningRxAboveDbm: -15,
    criticalRxBelowDbm: -29,
  },
};

const seededValue = (seed: string): number =>
  seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

export const fetchProviderSettings = async (): Promise<ProviderSettings> => {
  return getWithFallback('/provider/settings', () => providerSettings, 220);
};

export const fetchOnuTelemetry = async (oltId: string, ponPort: string): Promise<OnuTelemetry> => {
  return getWithFallback(`/provider/olt/${oltId}/pon/${encodeURIComponent(ponPort)}/onu`, () => {
    const seed = seededValue(`${oltId}-${ponPort}`);
    const normalized = (seed % 22) / 10;
    const rxPowerDbm = Number((-27 + normalized).toFixed(1));
    const txPowerDbm = Number((1.2 + ((seed % 8) / 10)).toFixed(1));
    const online = seed % 5 !== 0;

    return {
      onuSerial: `ONU-${seed}`,
      onuModel: seed % 2 === 0 ? 'Huawei EG8145V5' : 'ZTE F670L',
      rxPowerDbm,
      txPowerDbm,
      online,
    };
  }, 260);
};

export const fetchMikrotikIp = async (oltId: string, ponPort: string, onuSerial: string): Promise<string> => {
  return getWithFallback(`/provider/mikrotik/${oltId}/lease`, () => {
    const seed = seededValue(`${oltId}-${ponPort}-${onuSerial}`);
    const thirdOctet = 10 + (seed % 50);
    const fourthOctet = 2 + (seed % 220);
    return `100.64.${thirdOctet}.${fourthOctet}`;
  }, 210);
};

export const fetchCustomerConnectivityStatuses = async (
  customers: Array<{ id: string; rxPowerDbm: number }>,
  limits: SignalLimits,
): Promise<Record<string, CustomerConnectivityStatus>> => {
  return getWithFallback('/provider/connectivity/status', () => {
    const result: Record<string, CustomerConnectivityStatus> = {};

    customers.forEach((customer) => {
      const seed = seededValue(customer.id);
      const online = seed % 6 !== 0;

      let level: CustomerConnectivityLevel;
      if (!online) {
        level = 'offline';
      } else if (customer.rxPowerDbm >= limits.warningRxAboveDbm) {
        level = 'warning';
      } else {
        level = 'online';
      }

      result[customer.id] = {
        online,
        rxPowerDbm: customer.rxPowerDbm,
        level,
      };
    });

    return result;
  }, 180);
};
