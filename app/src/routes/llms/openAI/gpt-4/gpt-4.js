const express = require('express');
const router = express.Router();
const authenticateToken = require('../../../../middlewares/auth');
const axios = require('axios');
const User = require('../../../../models/User/User');

router.post('/gpt4', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const userApiKey = user.APIKey;
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: "Property text is missing" });
        }

        if (!userApiKey) {
            return res.status(400).json({ error: "API Key is missing for user" });
        }

        const response = await axios.post('https://api.openai.com/v1/assistants/gpt-4o/completions', {
            prompt: text,
            max_tokens: 150
        }, {
            headers: {
                'Authorization': `Bearer ${userApiKey}`,
                'Content-Type': 'application/json'
            }
        });

        res.status(200).json({ response: response.data.choices[0].text });
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
