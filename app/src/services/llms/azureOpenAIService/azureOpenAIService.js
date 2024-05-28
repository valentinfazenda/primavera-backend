const axios = require('axios');
const User = require('../../../models/User/User');
const Company = require('../../../models/Company/Company');

async function sendMessageToAzureOpenAI(userId, messages, modelName) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }
    const companyName = user.company;
    if (!companyName) {
        throw new Error("Company not found for user");
    }

    const company = await Company.findOne({ name: companyName });
    if (!company) {
        throw new Error("Company details not found");
    }

    const azureOpenAIDeploymentName = company.azureOpenAIDeploymentName;
    const azureOpenAIApiKey = company.azureOpenAIApiKey;
    if (!azureOpenAIDeploymentName || !azureOpenAIApiKey) {
        throw new Error("Deployment name or API key details not found");
    }

    const response = await axios.post(`https://${azureOpenAIDeploymentName}/openai/deployments/${modelName}/chat/completions?api-version=2024-02-01`, {
        messages: messages
    }, {
        headers: {
            'api-key': azureOpenAIApiKey,
            'Content-Type': 'application/json'
        }
    });
    return response.data.choices[0].message.content;
}

module.exports = {
    sendMessageToAzureOpenAI
};
