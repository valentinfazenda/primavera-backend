const axios = require('axios');
const User = require('../../../models/User/User');
const Company = require('../../../models/Company/Company');
const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");

async function sendMessageToAzureOpenAI(userId, messages, modelName,  stepId, socket) {
    // Fetch the user
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }
    if (!user.company) {
        throw new Error("Company not found for user");
    }

    // Fetch the company
    const company = await Company.findOne({ name: user.company });
    if (!company) {
        throw new Error("Company details not found");
    }

    const { azureOpenAIDeploymentName, azureOpenAIApiKey } = company;
    if (!azureOpenAIDeploymentName || !azureOpenAIApiKey) {
        throw new Error("Deployment name or API key details not found");
    }

    const url = `https://${azureOpenAIDeploymentName}/`;
    const client = new OpenAIClient(url, new AzureKeyCredential(azureOpenAIApiKey));

    const events = await client.streamChatCompletions(modelName, messages);
    let response = '';

    for await (const event of events) {
        const content = event.choices.map(choice => choice.delta?.content).filter(Boolean).join('');
        response += content;
        if (socket && content) {
            socket.emit('answer', { stepId, response, status: 'loading'});
        }
    }
    if (socket && response) {
        socket.emit('answer', { stepId, response, status: 'done'});
    }
    
    return response;
}

module.exports = {
    sendMessageToAzureOpenAI
};
