export type User = {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'technician' | 'customer';
};

export type Technician = {
    id: string;
    name: string;
    assignedTasks: string[];
};

export type Customer = {
    id: string;
    name: string;
    address: string;
    contactNumber: string;
};

export type WorkOrder = {
    id: string;
    technicianId: string;
    customerId: string;
    status: 'pending' | 'in-progress' | 'completed';
    details: string;
};

export type NetworkStatus = {
    id: string;
    status: 'online' | 'offline' | 'maintenance';
    lastChecked: Date;
};

export type BillingInfo = {
    id: string;
    customerId: string;
    amount: number;
    dueDate: Date;
    status: 'paid' | 'unpaid' | 'overdue';
};

export type Ticket = {
    id: string;
    customerId: string;
    technicianId: string;
    status: 'open' | 'in-progress' | 'resolved';
    description: string;
    createdAt: Date;
};