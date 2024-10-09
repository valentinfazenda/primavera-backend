import Model from '../../../models/Model/Model.js';
import { AzureOpenAI } from "openai";

async function sendMessageToAzureOpenAI(messages, model, socket) {
    // Find the model and verify it exists
    await Model.findOne({ modelId: model._id }).orFail(new Error("Model not found"));
    
    const apiKey = model.apiKey;
    const apiVersion = model.apiVersion;
    const azureOpenAIDeploymentName = model.azureOpenAIDeploymentName;

    if (!azureOpenAIDeploymentName || !apiKey || !apiVersion) {
        throw new Error("Deployment name, API version or API key details not found");
    }

    // Configure the AzureOpenAI client
    const options = {
        apiKey: apiKey,
        endpoint: `https://${azureOpenAIDeploymentName}.openai.azure.com/`,
        apiVersion: apiVersion
    };
    const client = new AzureOpenAI(options);

    // Stream chat completions from the Azure OpenAI
    let response = '';
    const completions = await client.chat.completions.create({
        messages: messages.map(message => ({ role: "user", content: message })),
        model: ModelLlm.modelDeploymentName, // Assume `modelDeploymentName` corresponds to the model identifier
        max_tokens: 400 // You can adjust `max_tokens` as necessary
    });

    // Process and handle the response
    completions.choices.forEach(choice => {
        const content = choice.message.content;
        response += content;
        if (socket && content) {
            socket.emit('message', { response, status: 'loading' });
        }
    });

    // Final socket emission on completion
    if (socket && response) {
        socket.emit('message', { response, status: 'done' });
    }

    return response;
}

export {
    sendMessageToAzureOpenAI
};
