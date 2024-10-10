import fs from 'fs/promises';  // Promise-based file system interaction
import path from 'path';  // For resolving file paths
import Chat from '../../../models/Chat/Chat.js';
import { sendMessageToAzureOpenAI } from '../../llms/azureOpenAIService/azureOpenAIService.js';

async function messageGenerationService(context, chatId, socket) {
    try {
        // Define the path to the prompt file
        const filePath = path.resolve(__dirname, '../../prompts/generateAnswerMessage.txt');

        // Read the prompt template from the file
        let template = await fs.readFile(filePath, 'utf8');

        // Replace the placeholder with the actual context
        const customizedMessage = template.replace(/{{\$context}}/g, context.documents).replace(/{{\$query}}/g, context.query);

        // Find the chat
        const chat = await Chat.findById(chatId);
        if (!chat) throw new Error('Chat not found');
        const model = chat.modelId;

        // Send the processed text to the llmService
        const response = await sendMessageToAzureOpenAI(customizedMessage, model, socket);

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
