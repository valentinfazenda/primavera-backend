import axios from 'axios';
import User from '../../../models/User/User.js';
import Company from '../../../models/Company/Company.js';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

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
            socket.emit('message', { stepId, response, status: 'loading'});
        }
    }
    if (socket && response) {
        socket.emit('message', { stepId, response, status: 'done'});
    }
    
    return response;
}

export {
    sendMessageToAzureOpenAI
};
