import express from 'express';
const router = express.Router();
import { authenticateToken } from '../../../middlewares/auth.js';
import { sendMessageToOpenAI } from '../../../services/llms/openAIService/openAIService.js';

router.post('', authenticateToken, async (req, res) => {
    try {
        const { model, messages } = req.body;
        if (!model || !messages) {
            return res.status(400).json({ error: "Property model or messages is missing" });
        }

        const userId = req.user.id;
        const messageContent = await sendMessageToOpenAI(userId, messages, model);
        res.status(200).json({ message: messageContent });
    } catch (error) {
        console.error(error);
        if (error.response) {
            res.status(error.response.status).json({ error: error.response.data });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

export default router;
