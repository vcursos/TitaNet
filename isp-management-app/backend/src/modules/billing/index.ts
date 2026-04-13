import { Router } from 'express';
import { generateInvoice, processPayment, getInvoiceDetails } from './billingService';

const router = Router();

// Route to generate an invoice
router.post('/invoices', async (req, res) => {
    try {
        const invoice = await generateInvoice(req.body);
        res.status(201).json(invoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to process a payment
router.post('/payments', async (req, res) => {
    try {
        const payment = await processPayment(req.body);
        res.status(200).json(payment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Route to get invoice details
router.get('/invoices/:id', async (req, res) => {
    try {
        const invoiceDetails = await getInvoiceDetails(req.params.id);
        res.status(200).json(invoiceDetails);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;