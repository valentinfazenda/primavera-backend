import Chat from '../../models/Chat/Chat.js';
import Message from '../../models/Message/Message.js';
import Workspace from '../../models/Workspace/Workspace.js';
import { messageGenerationService } from '../generationService/messageService/messageService.js';
import { queryGeneratorService } from '../search/queryGeneratorService/queryGeneratorService.js';
import { searchService } from '../search/searchService.js';

async function executeMessage(message, chatId, userId, socket) {
    try {
        // Find the chat by its ID
        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new Error('Chat not found');
        }

        // Create new message for the user's message
        const userMessage = new Message({
            chatId: chat._id,  // Reference to the chat document
            text: message,  // Text from the socket message
        });
        await userMessage.save();  // Save the user message to the database

        // Fetch the workspace to verify the user's access based on workspace ownership
        const workspace = await Workspace.findById(chat.workspaceId);
        if (!workspace || workspace.userId.toString() !== userId) {
            throw new Error('Unauthorized access');
        }

        const chatHistory = await Message.find({ chatId: chat._id }).sort({ creationDate: 1 });

        // Generate queries based on the message received through the socket
        const modelId = chat.modelId;
        let queries = JSON.parse(await queryGeneratorService(message, modelId, chatHistory));
        console.log(queries);
        // Execute the search for each generated queries, create a chunks object that is an array of strings
        let chunks = [];
        if (queries.queries) {
             for (const query of queries.queries) {
                 const result = await searchService(query);
                 console.log("result", result);
                 chunks.push(result);
             }
         }

        // Generate a response from the search results
        const context = {
            chunks: chunks,
            query: message
        };
        const response = await messageGenerationService(context, modelId, chatId, socket);

        // Create new message for the agent's response
        const agentMessage = new Message({
            chatId: chat._id,  // Reference to the chat document
             text: response,  // Response text from the service
         });
        await agentMessage.save();

        // Return the search service response
        return response;
    } catch (error) {
        // Log and rethrow any errors encountered during the function execution
        console.error('Error executing message:', error);
        throw error;
    }
}

export {
    executeMessage
};
