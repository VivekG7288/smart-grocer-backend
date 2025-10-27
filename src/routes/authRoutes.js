import express from 'express';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

// Handle preflight requests for auth routes
router.options('*', (req, res) => {
    console.log('[Auth Routes] Handling OPTIONS request');
    res.status(200).end();
});

router.post('/register', register);
router.post('/login', login);

export default router;
