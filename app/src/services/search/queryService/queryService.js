import fs from 'fs/promises';  // Use the Promise-based version of the fs module
import path from 'path';  // For resolving file paths
import axios from 'axios';  // Assumed HTTP client for making requests to an external service
import { sendMessageToAzureOpenAI } from '../../llms/azureOpenAIService/azureOpenAIService.js';

async function generateQueries(message, model, socket) {
    try {
        // Load the query template from a file
        const templatePath = path.resolve(__dirname, 'generateQuery.txt');  // Adjust the file path as necessary
        let template = await fs.readFile(templatePath, 'utf8');

        // Replace placeholders in the template with the actual message
        const query = template.replace(/{{message}}/g, message);

        // Send the processed query to the llm service
        const response = await sendMessageToAzureOpenAI(query, model);

        // Return the answer as an array of strings
        return response;  // Assuming the llmService returns data in the correct format
    } catch (error) {
        console.error('Error generating queries:', error);
        throw error;  // Rethrow to handle it in the calling function
    }
}

export {
    generateQueries  // Make sure to export to use in other parts of your application
};
