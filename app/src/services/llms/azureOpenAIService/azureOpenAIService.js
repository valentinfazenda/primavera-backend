;import AzureOpenAIEndpoint from '../../../models/AzureOpenAIEndpoint/AzureOpenAIEndpoint.js';
import { OpenAIClient, AzureKeyCredential } from '@azure/openai';

async function sendMessageToAzureOpenAI( messages, model,  stepId, socket) {

    const azureOpenAIEndpoint = await AzureOpenAIEndpoint.findOne({ modelId: model._id }).orFail(new Error("AzureOpenAIEndpoint not found"));
    const apiKey = model.apiKey;

    const { azureOpenAIDeploymentName, modelDeploymentName } = azureOpenAIEndpoint;
    if (!azureOpenAIDeploymentName || !apiKey) {
        throw new Error("Deployment name or API key details not found");
    }


    const url = `https://${azureOpenAIDeploymentName}/`;
    const client = new OpenAIClient(url, new AzureKeyCredential(apiKey));

    const events = await client.streamChatCompletions(modelDeploymentName, messages);
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
