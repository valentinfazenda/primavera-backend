import fs from 'fs/promises';  // Promise-based file system interaction
import path from 'path';  // For resolving file paths
import Chat from '../../../models/Chat/Chat.js';
import { sendMessageToAzureOpenAI } from '../../llms/azureOpenAIService/azureOpenAIService.js';
import Model from '../../../models/Model/Model.js';

async function messageGenerationService(context, modelId, chatId, socket) {
    try {
        // Define the path to the prompt file using a relative path
        const filePath = path.resolve('app/src/prompts/generateAnswerMessage.txt');

        // Read the prompt template from the file
        let template = await fs.readFile(filePath, 'utf8');

        // Replace the placeholder with the actual context
        const messagePrompt = template
            .replace(/{{\$context}}/g, context.chunks)
            .replace(/{{\$query}}/g, context.query);

        // Find the chat
        const model = await Model.findById(modelId).orFail(new Error("Model not found"));

        // Send the processed text to the llmService
        const response = await sendMessageToAzureOpenAI(messagePrompt, model, socket);

        // Return the response, assuming it's a string
        return response;
    } catch (error) {
        console.error('Error in messageGenerationService:', error);
        throw error;
    }
}

export {
    messageGenerationService
};
