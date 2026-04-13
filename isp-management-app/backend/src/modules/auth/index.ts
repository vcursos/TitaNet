import { Router } from 'express';
import { login, register, verifyToken } from './auth.controller';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.get('/verify', verifyToken);

export default router;