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
        const queries = await queryGeneratorService(message, modelId, chatHistory);
        // Execute the search with the generated queries
        // const chunks = await searchService(queries); TO BE DONE
        // Generate a response from the search results
        // const response = await messageGenerationService(chunks, message, socket); TO BE DONE

        // Create new message for the agent's response
        // const agentMessage = new Message({
        //     chatId: chat._id,  // Reference to the chat document
        //     text: response,  // Response text from the service
        // });
        // await agentMessage.save();  // Save the agent message to the database

        // Return the search service response
        return queries;
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
