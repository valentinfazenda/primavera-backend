import express from 'express';
const router = express.Router();
import { register, login, getUser } from '../controllers/authController.js';
import { authenticateToken }  from '../middlewares/auth.js';

router.post('/register', register);
router.post('/login', login);
router.get('/user', authenticateToken , getUser);

export default router;
