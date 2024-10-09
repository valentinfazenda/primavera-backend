import express from 'express';
const router = express.Router();
import { authenticateToken } from '../../middlewares/auth.js';
import Chat from '../../models/Chat/Chat.js';
import Workspace from '../../models/Workspace/Workspace.js';
import Message from '../../models/Message/Message.js';

// Endpoint to add a new chat
router.post('/add', authenticateToken, async (req, res) => {
    const { workspaceId } = req.body;

    try {
        // Verify that the workspace exists and belongs to the authenticated user
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Check if the user is authorized to add a chat to this workspace
        if (workspace.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized access to this workspace" });
        }

        // Create a new chat associated with the workspace
        const newChat = new Chat({
            workspaceId
        });

        const savedChat = await newChat.save();
        res.status(201).json(savedChat); // Return the saved chat
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to delete a chat
router.delete('/delete', authenticateToken, async (req, res) => {
    const { chatId } = req.body;

    try {
        // Verify that the chat exists
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        // Retrieve the workspaceId from the chat and check if the user owns the workspace
        const workspace = await Workspace.findById(chat.workspaceId);
        if (!workspace || workspace.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized access to this workspace" });
        }

        // Delete the chat
        await Chat.findByIdAndDelete(chatId);
        res.status(200).json({ message: "Chat deleted successfully" });
    } catch (error) {
        console.error('Error deleting chat:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to get chat details by ID
router.post('/details', authenticateToken, async (req, res) => {
    const { chatId } = req.body;

    try {
        // Verify that the chat exists
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        // Retrieve the workspaceId from the chat and check if the user owns the workspace
        const workspace = await Workspace.findById(chat.workspaceId);
        if (!workspace || workspace.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized access to this workspace" });
        }

        // Return the chat details
        res.status(200).json(chat);
    } catch (error) {
        console.error('Error fetching chat details:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to list all chats associated with a specific workspace
router.get('/list', authenticateToken, async (req, res) => {
    const { workspaceId } = req.query;

    try {
        // Verify that the workspace exists and belongs to the authenticated user
        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Check if the user is authorized to list chats for this workspace
        if (workspace.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized access to this workspace" });
        }

        // List all chats associated with this workspace
        const chats = await Chat.find({ workspaceId });
        res.status(200).json(chats); // Return the list of chats
    } catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to update a chat and add a message if provided
router.patch('/update', authenticateToken, async (req, res) => {
    const { chatId, message } = req.body;

    try {
        // Verify that the chat exists
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" });
        }

        // Retrieve the workspaceId from the chat and check if the user owns the workspace
        const workspace = await Workspace.findById(chat.workspaceId);
        if (!workspace || workspace.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized access to this workspace" });
        }

        // Update the chat if there are any fields to update (you can add more fields to be updated if needed)
        const updateFields = {};
        // If more fields need to be updated in the future, add them here like this:
        // if (req.body.someField) updateFields.someField = req.body.someField;
        
        // Perform the update (if any fields are provided for update)
        if (Object.keys(updateFields).length > 0) {
            await Chat.findByIdAndUpdate(chatId, updateFields);
        }

        // If there's a message object in the request, create a new message for this chat
        if (message) {
            const newMessage = new Message({
                chatId,
                text: message.text,
            });

            // Save the new message
            const savedMessage = await newMessage.save();
            return res.status(200).json({ message: "Chat updated and message created", chat, savedMessage });
        }

        res.status(200).json({ message: "Chat updated", chat });
    } catch (error) {
        console.error('Error updating chat:', error);
        res.status(500).json({ error: error.message });
    }
});


export default router;
