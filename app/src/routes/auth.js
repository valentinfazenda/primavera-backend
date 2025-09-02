import express from 'express';
const router = express.Router();
import { register, login, getUser, session } from '../controllers/authController.js';
import { authenticateToken }  from '../middlewares/auth.js';

router.post('/register', register);
router.post('/login', login);
router.get('/user', authenticateToken , getUser);
router.get("/session", authenticateToken, session);

export default router;
