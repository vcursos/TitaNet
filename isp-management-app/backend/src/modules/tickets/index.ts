import { Router } from 'express';
import { createTicket, getTickets, updateTicketStatus } from './ticketController';

const router = Router();

router.post('/tickets', createTicket);
router.get('/tickets', getTickets);
router.patch('/tickets/:id/status', updateTicketStatus);

export default router;