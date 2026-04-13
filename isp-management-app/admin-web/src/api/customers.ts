import { getWithFallback, patchWithFallback, postWithFallback } from './http';

export type CustomerStatus = 'Ativo' | 'Suspenso' | 'Pré-cadastro';
export type PaymentStatus = 'Em dia' | 'Atrasado';
export type CustomerType = 'PF' | 'PJ' | 'Estrangeiro';

export interface PhoneItem {
  number: string;
  isMain: boolean;
}

export interface EmailItem {
  address: string;
  isMain: boolean;
}

export interface LoanedDevice {
  name: string;
}

export interface CustomerFinancial {
  monthlyFee: number;
  balanceDue: number;
  lastPaymentDate: string;
  paymentStatus: PaymentStatus;
  paymentGateway?: string;
}

export interface CustomerConnection {
  olt: string;
  ponPort: string;
  onuSerial: string;
  onuModel: string;
  rxPowerDbm: number;
  txPowerDbm: number;
  ipv4: string;
  latitude?: string;
  longitude?: string;
}

export interface Customer {
  id: string;
  contractNumber: string;
  customerType: CustomerType;
  document: string;
  name: string;
  emails: EmailItem[];
  phones: PhoneItem[];
  address: string;
  neighborhood: string;
  city: string;
  plan: string;
  tvPlan?: string;
  loanedDevices: LoanedDevice[];
  status: CustomerStatus;
  financial: CustomerFinancial;
  connection: CustomerConnection;
}

export interface CreateCustomerInput {
  customerType: CustomerType;
  document: string;
  name: string;
  emails: EmailItem[];
  phones: PhoneItem[];
  address: string;
  neighborhood: string;
  city: string;
  plan: string;
  tvPlan?: string;
  loanedDevices: LoanedDevice[];
  status: CustomerStatus;
  financial: CustomerFinancial;
  connection: CustomerConnection;
}

export interface UpdateCustomerInput {
  customerType: CustomerType;
  document: string;
  name: string;
  emails: EmailItem[];
  phones: PhoneItem[];
  address: string;
  neighborhood: string;
  city: string;
  plan: string;
  tvPlan?: string;
  loanedDevices: LoanedDevice[];
  status: CustomerStatus;
  financial: CustomerFinancial;
  connection: CustomerConnection;
}

let customersDb: Customer[] = [
  {
    id: '1',
    contractNumber: 'CTR-0001',
    customerType: 'PF',
    document: '111.111.111-11',
    name: 'Ana Paula Nunes',
    emails: [{ address: 'ana.nunes@provedor.com', isMain: true }],
    phones: [{ number: '(79) 99801-1111', isMain: true }],
    address: 'Rua das Flores, 120',
    neighborhood: 'Centro',
    city: 'Aracaju',
    plan: '400 Mega',
    tvPlan: 'basico',
    loanedDevices: [{ name: 'Roteador Wi-Fi 6' }],
    status: 'Ativo',
    financial: {
      monthlyFee: 109.9,
      balanceDue: 0,
      lastPaymentDate: '2026-04-05',
      paymentStatus: 'Em dia',
      paymentGateway: 'gerencianet',
    },
    connection: {
      olt: 'OLT-01',
      ponPort: 'PON 1/8',
      onuSerial: 'HWTC12345678',
      onuModel: 'Huawei EG8145V5',
      rxPowerDbm: -20.5,
      txPowerDbm: 2.1,
      ipv4: '100.64.10.21',
      latitude: '-10.9472',
      longitude: '-37.0731',
    },
  },
  {
    id: '2',
    contractNumber: 'CTR-0002',
    customerType: 'PJ',
    document: '22.222.222/0001-22',
    name: 'Bruno Oliveira',
    emails: [{ address: 'bruno.oliveira@provedor.com', isMain: true }],
    phones: [{ number: '(79) 99802-2222', isMain: true }],
    address: 'Av. Beira Mar, 450',
    neighborhood: '13 de Julho',
    city: 'Aracaju',
    plan: '600 Mega',
    loanedDevices: [],
    status: 'Ativo',
    financial: {
      monthlyFee: 139.9,
      balanceDue: 39.9,
      lastPaymentDate: '2026-03-02',
      paymentStatus: 'Atrasado',
    },
    connection: {
      olt: 'OLT-02',
      ponPort: 'PON 2/4',
      onuSerial: 'ANLT87654321',
      onuModel: 'Intelbras R1',
      rxPowerDbm: -26.4,
      txPowerDbm: 1.8,
      ipv4: '100.64.10.34',
    },
  },
  {
    id: '3',
    contractNumber: 'CTR-0003',
    customerType: 'PF',
    document: '333.333.333-33',
    name: 'Carla Mendes',
    emails: [{ address: 'carla.mendes@provedor.com', isMain: true }],
    phones: [{ number: '(79) 99803-3333', isMain: true }],
    address: 'Rua A, 33',
    neighborhood: 'Santos Dumont',
    city: 'Aracaju',
    plan: '200 Mega',
    loanedDevices: [],
    status: 'Suspenso',
    financial: {
      monthlyFee: 89.9,
      balanceDue: 179.8,
      lastPaymentDate: '2026-01-11',
      paymentStatus: 'Atrasado',
    },
    connection: {
      olt: 'OLT-03',
      ponPort: 'PON 3/7',
      onuSerial: 'ZTEX23423423',
      onuModel: 'ZTE F670L',
      rxPowerDbm: -28.1,
      txPowerDbm: 1.5,
      ipv4: '100.64.10.56',
    },
  },
];

export const fetchCustomers = async (): Promise<Customer[]> => {
  return getWithFallback('/customers', () => [...customersDb], 250);
};

export const fetchCustomerById = async (id: string): Promise<Customer | null> => {
  return getWithFallback(`/customers/${id}`, () => {
    const found = customersDb.find((customer) => customer.id === id);
    return found || null;
  }, 180);
};

export const createCustomer = async (input: CreateCustomerInput): Promise<Customer> => {
  return postWithFallback('/customers', input, () => {
    const newCustomer: Customer = {
      id: String(Date.now()),
      contractNumber: `CTR-${Math.floor(1000 + Math.random() * 9000)}`,
      customerType: input.customerType,
      document: input.document.trim(),
      name: input.name.trim(),
      emails: [...input.emails],
      phones: [...input.phones],
      address: input.address.trim(),
      neighborhood: input.neighborhood.trim(),
      city: input.city.trim(),
      plan: input.plan.trim(),
      tvPlan: input.tvPlan,
      loanedDevices: [...input.loanedDevices],
      status: input.status,
      financial: { ...input.financial },
      connection: { ...input.connection },
    };

    customersDb = [newCustomer, ...customersDb];
    return newCustomer;
  }, 220);
};

export const updateCustomer = async (id: string, input: UpdateCustomerInput): Promise<Customer | null> => {
  return patchWithFallback(`/customers/${id}`, input, () => {
    const index = customersDb.findIndex((customer) => customer.id === id);
    if (index < 0) {
      return null;
    }

    const updated: Customer = {
      ...customersDb[index],
      customerType: input.customerType,
      document: input.document.trim(),
      name: input.name.trim(),
      emails: [...input.emails],
      phones: [...input.phones],
      address: input.address.trim(),
      neighborhood: input.neighborhood.trim(),
      city: input.city.trim(),
      plan: input.plan.trim(),
      tvPlan: input.tvPlan,
      loanedDevices: [...input.loanedDevices],
      status: input.status,
      financial: { ...input.financial },
      connection: { ...input.connection },
    };

    customersDb = customersDb.map((customer) => (customer.id === id ? updated : customer));
    return updated;
  }, 220);
};
