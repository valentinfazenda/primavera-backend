import fs from 'fs/promises';  // Promise-based file system interaction
import path from 'path';  // For resolving file paths
import axios from 'axios';  // Assumed HTTP client for making requests

async function messageGenerationService(context, socket) {
    try {
        // Define the path to the prompt file
        const filePath = path.resolve(__dirname, '../../prompts/generateAnswerMessage.txt');

        // Read the prompt template from the file
        let template = await fs.readFile(filePath, 'utf8');

        // Replace the placeholder with the actual context
        const customizedMessage = template.replace(/{{\$context}}/g, context);

        // Assuming the LLM service needs a model identifier, define it
        const model = 'model-name';  // Replace 'model-name' with your actual model identifier

        // Send the processed text to the llmService
        const response = await sendMessageToAzureOpenAI(query, model);

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
