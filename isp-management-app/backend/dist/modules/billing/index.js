"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const billingService_1 = require("./billingService");
const router = (0, express_1.Router)();
// Route to generate an invoice
router.post('/invoices', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const invoice = yield (0, billingService_1.generateInvoice)(req.body);
        res.status(201).json(invoice);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
// Route to process a payment
router.post('/payments', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const payment = yield (0, billingService_1.processPayment)(req.body);
        res.status(200).json(payment);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
// Route to get invoice details
router.get('/invoices/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const invoiceDetails = yield (0, billingService_1.getInvoiceDetails)(req.params.id);
        res.status(200).json(invoiceDetails);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
}));
exports.default = router;
