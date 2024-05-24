const express = require('express');
const router = express.Router();
const authenticateToken = require('../../../middlewares/auth');
const axios = require('axios');
const User = require('../../../models/User/User');
const Company = require('../../../models/Company/Company');

router.post('', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const companyName = user.company;
        if (!companyName) {
            return res.status(404).json({ error: "Company not found for user" });
        }

        const company = await Company.findOne({ name: companyName });
        if (!company) {
            return res.status(404).json({ error: "Company details not found" });
        }

        const azureOpenAIDeploymentName = company.azureOpenAIDeploymentName;
        const azureOpenAIApiKey = company.azureOpenAIApiKey;
        if (!azureOpenAIDeploymentName) {
            return res.status(404).json({ error: "Deployment name details not found" });
        }
        if (!azureOpenAIApiKey) {
            return res.status(404).json({ error: "API key details not found" });
        }

        const { messages, modelName } = req.body;

        if (!messages) {
            return res.status(400).json({ error: "Property messages is missing" });
        }

        const response = await axios.post(`https://${azureOpenAIDeploymentName}/openai/deployments/${modelName}/chat/completions?api-version=2024-02-01`, {
            messages: messages
        }, {
            headers: {
                'api-key': azureOpenAIApiKey,
                'Content-Type': 'application/json'
            }
        });

        res.status(200).json({ response: response.data.choices[0].message.content });
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
