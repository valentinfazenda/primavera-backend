import Model from '../../../models/Model/Model.js';
import { AzureOpenAI } from "openai";

async function sendMessageToAzureOpenAI(messages, model, socket) {
    // Find the model and verify it exists
    await Model.findById(model._id).orFail(new Error("Model not found"));

    
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
    const messagesArray = [
        {
          role: "user",
          content : messages,
        },
      ];

    const events = await client.chat.completions.create({
        messages: messagesArray,
        model: model.modelDeploymentName, 
        max_tokens: 16000, 
        stream: true
    });
    // response = completions.choices[0].message.content

    for await (const event of events) {
        const content = event.choices.map(choice => choice.delta?.content).filter(Boolean).join('');
        response += content;
        if (socket && content) {
            socket.emit('message', { response, status: 'loading', type: 'message' });
        }
    }
    if (socket && response) {
        socket.emit('message', { response, status: 'done', type: 'message' });
    }

    // // Process and handle the response
    // completions.choices.forEach(choice => {
    //     const content = choice.message.content;
    //     response += content;
    //     if (socket && content) {
    //         socket.emit('message', { response, status: 'loading' });
    //     }
    // });
    return response;
}

export {
    sendMessageToAzureOpenAI
};
