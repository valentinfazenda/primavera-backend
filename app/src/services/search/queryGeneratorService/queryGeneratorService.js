import fs from 'fs/promises';  // Use the Promise-based version of the fs module
import { sendMessageToAzureOpenAI } from '../../llms/azureOpenAIService/azureOpenAIService.js';
import Model from '../../../models/Model/Model.js';

async function queryGeneratorService(message, modelId, chatHistory) {
    try {
        // Directly specify the absolute path to the template
        const filePath = 'C:\\Users\\Valentin.FAZENDA\\OneDrive - Sinequa\\Documents\\GitHub\\primavera-backend\\app\\src\\prompts\\generateQuery.txt';

        // Load the query template from a file
        let template = await fs.readFile(filePath, 'utf8');

        // Replace placeholders in the template with the actual message and chat history
        const messagePrompt = template.replaceAll(/{{\$message}}/g, message).replaceAll(/{{\$chatHistory}}/g, chatHistory);

        // Send the processed query to the llm service
        const model = await Model.findById(modelId).orFail(new Error("Model not found"));
        
        const response = (await sendMessageToAzureOpenAI(messagePrompt, model)).replaceAll('```', '').replace('json','').replaceAll('\n','').replaceAll(/\\/g,'');

        // Return the answer as an array of strings
        return response;  // Assuming the llmService returns data in the correct format
    } catch (error) {
        console.error('Error generating queries:', error);
        throw error;  // Rethrow to handle it in the calling function
    }
}

export {
    queryGeneratorService  // Make sure to export to use in other parts of your application
};
