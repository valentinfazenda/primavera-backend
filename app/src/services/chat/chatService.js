import Chat from '../../models/Chat/Chat.js';
import Message from '../../models/Message/Message.js';
import Workspace from '../../models/Workspace/Workspace.js';

async function executeMessage(chatId, userId, socket) {
    try {
        // Find the chat by its ID
        const chat = await Chat.findById(chatId);
        if (!chat) {
            throw new Error('Chat not found');
        }

        // Create new message for the user's message
        const userMessage = new Message({
            chatId: chat._id,  // Reference to the chat document
            text: socket.message,  // Text from the socket message
        });
        await userMessage.save();  // Save the user message to the database

        // Fetch the workspace to verify the user's access based on workspace ownership
        const workspace = await Workspace.findById(chat.workspaceId);
        if (!workspace || workspace.userId.toString() !== userId) {
            throw new Error('Unauthorized access');
        }

        // Generate queries based on the message received through the socket
        const queries = await queryService(socket.message);
        // Execute the search with the generated queries
        const response = await searchService(queries);

        // Create new message for the agent's response
        const agentMessage = new Message({
            chatId: chat._id,  // Reference to the chat document
            text: response,  // Response text from the service
        });
        await agentMessage.save();  // Save the agent message to the database

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
