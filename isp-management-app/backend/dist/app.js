"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = require("body-parser");
const config_1 = require("./config");
const auth_1 = __importDefault(require("./modules/auth"));
const admins_1 = __importDefault(require("./modules/admins"));
const technicians_1 = __importDefault(require("./modules/technicians"));
const customers_1 = __importDefault(require("./modules/customers"));
const network_1 = __importDefault(require("./modules/network"));
const billing_1 = __importDefault(require("./modules/billing"));
const tickets_1 = __importDefault(require("./modules/tickets"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, body_parser_1.json)());
// Database connection
(0, config_1.connectDB)();
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/admins', admins_1.default);
app.use('/api/technicians', technicians_1.default);
app.use('/api/customers', customers_1.default);
app.use('/api/network', network_1.default);
app.use('/api/billing', billing_1.default);
app.use('/api/tickets', tickets_1.default);
// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
