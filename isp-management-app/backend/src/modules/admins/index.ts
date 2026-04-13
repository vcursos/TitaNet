import { Router } from 'express';
import { createAdmin, getAdmins, updateAdmin, deleteAdmin } from './admin.controller';

const router = Router();

router.post('/', createAdmin);
router.get('/', getAdmins);
router.put('/:id', updateAdmin);
router.delete('/:id', deleteAdmin);

export default router;