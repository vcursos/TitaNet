export interface User {
    id: string;
    username: string;
    password: string;
    role: 'admin' | 'technician' | 'customer';
}

export interface Admin extends User {
    permissions: string[];
}

export interface Technician extends User {
    assignedTasks: Task[];
}

export interface Customer extends User {
    contactInfo: ContactInfo;
}

export interface Task {
    id: string;
    description: string;
    status: 'pending' | 'in-progress' | 'completed';
    technicianId: string;
}

export interface ContactInfo {
    email: string;
    phone: string;
    address: string;
}

export interface NetworkStatus {
    isConnected: boolean;
    lastChecked: Date;
}

export interface Invoice {
    id: string;
    customerId: string;
    amount: number;
    dueDate: Date;
    status: 'paid' | 'unpaid' | 'overdue';
}

export interface Ticket {
    id: string;
    customerId: string;
    issueDescription: string;
    status: 'open' | 'in-progress' | 'resolved';
    createdAt: Date;
    updatedAt: Date;
}