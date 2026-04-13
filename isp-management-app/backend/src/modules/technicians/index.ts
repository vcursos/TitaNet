import { Router } from 'express';
import { getTechnicians, createTechnician, updateTechnician, deleteTechnician } from './technician.controller';

const router = Router();

router.get('/', getTechnicians);
router.post('/', createTechnician);
router.put('/:id', updateTechnician);
router.delete('/:id', deleteTechnician);

export default router;