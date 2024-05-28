const express = require('express');
const router = express.Router();
const authenticateToken = require('../../../middlewares/auth');
const { sendMessageToAzureOpenAI } = require('../../../services/llms/azureOpenAIService/azureOpenAIService');

router.post('', authenticateToken, async (req, res) => {
    try {
        const { messages, modelName } = req.body;
        if (!messages || !modelName) {
            return res.status(400).json({ error: "Property messages or modelName is missing" });
        }

        const userId = req.user.id;
        const messageContent = await sendMessageToAzureOpenAI(userId, messages, modelName);
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

module.exports = router;
