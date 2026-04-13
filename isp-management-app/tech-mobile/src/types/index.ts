export type Technician = {
    id: string;
    name: string;
    email: string;
    phone: string;
    assignedTasks: string[];
};

export type WorkOrder = {
    id: string;
    customerId: string;
    technicianId: string;
    status: 'pending' | 'in-progress' | 'completed';
    description: string;
    createdAt: Date;
    updatedAt: Date;
};

export type CustomerDetail = {
    id: string;
    name: string;
    address: string;
    contactNumber: string;
    email: string;
    serviceStatus: 'active' | 'inactive';
};

export type DiagnosticReport = {
    id: string;
    technicianId: string;
    customerId: string;
    findings: string;
    recommendations: string;
    createdAt: Date;
};