import express from 'express';
import { messaging } from '../utils/firebase.js';

const router = express.Router();

// Test endpoint to verify Firebase setup
router.post('/test', async (req, res) => {
    try {
        const { token, title, body } = req.body;
        
        const message = {
            notification: {
                title: title || 'Test Notification',
                body: body || 'This is a test notification'
            },
            token
        };

        const response = await messaging.send(message);
        res.json({ success: true, messageId: response });
    } catch (error) {
        console.error('Firebase test notification error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            code: error.code,
            details: error.errorInfo
        });
    }
});

export default router;