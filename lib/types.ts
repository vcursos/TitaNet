// =============================================================================
// Tipos compartilhados do TitaNet
// =============================================================================

export type CustomerStatus = 'active' | 'inactive' | 'overdue' | 'suspended'
export type DocumentType = 'CPF' | 'CNPJ'
export type ContractStatus = 'draft' | 'sent' | 'signed' | 'cancelled'

export interface DashboardStats {
  totalCustomers: number
  activeCustomers: number
  inactiveCustomers: number
  overdueCustomers: number
  suspendedCustomers: number
  totalPlans: number
  totalContracts: number
  monthlyRevenue: number
  onlineCustomers: number
  offlineCustomers: number
}

export interface ThemeColors {
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

export interface ReceitaFederalData {
  document: string
  status: string // ATIVA | INAPTA | etc.
  name?: string
  fantasy?: string
  openingDate?: string
  legalNature?: string
  mainActivity?: string
  address?: {
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
  }
  phone?: string
  email?: string
  capital?: string
  // Dados crus retornados pela API externa
  raw?: Record<string, any>
}

export interface ONUSignalData {
  customerId: string
  signalDbm: number
  status: 'ok' | 'warning' | 'critical' | 'offline'
  rxPower?: number
  txPower?: number
  temperature?: number
  uptime?: string
  checkedAt: string
}
