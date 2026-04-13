import express from 'express';
import { json } from 'body-parser';
import { connectDB } from './config';
import authRoutes from './modules/auth';
import adminRoutes from './modules/admins';
import technicianRoutes from './modules/technicians';
import customerRoutes from './modules/customers';
import networkRoutes from './modules/network';
import billingRoutes from './modules/billing';
import ticketRoutes from './modules/tickets';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(json());

// Database connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/network', networkRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/tickets', ticketRoutes);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});