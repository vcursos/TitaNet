import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.API_BASE_URL || 'http://localhost:3000/api',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getTechnicians = async () => {
    const response = await apiClient.get('/technicians');
    return response.data;
};

export const getCustomers = async () => {
    const response = await apiClient.get('/customers');
    return response.data;
};

export const createTicket = async (ticketData) => {
    const response = await apiClient.post('/tickets', ticketData);
    return response.data;
};

export const login = async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
};

export const getNetworkStatus = async () => {
    const response = await apiClient.get('/network/status');
    return response.data;
};