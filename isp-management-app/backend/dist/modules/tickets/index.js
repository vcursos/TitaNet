"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ticketController_1 = require("./ticketController");
const router = (0, express_1.Router)();
router.post('/tickets', ticketController_1.createTicket);
router.get('/tickets', ticketController_1.getTickets);
router.patch('/tickets/:id/status', ticketController_1.updateTicketStatus);
exports.default = router;
