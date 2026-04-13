export interface Admin {
    id: string;
    name: string;
    email: string;
    permissions: string[];
}

export interface Technician {
    id: string;
    name: string;
    email: string;
    assignedTasks: string[];
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
}

export interface NetworkStatus {
    id: string;
    status: 'online' | 'offline' | 'maintenance';
    lastChecked: Date;
}

export interface BillingInfo {
    id: string;
    customerId: string;
    amountDue: number;
    dueDate: Date;
    status: 'paid' | 'unpaid' | 'overdue';
}

export interface Permission {
    id: string;
    name: string;
    description: string;
}