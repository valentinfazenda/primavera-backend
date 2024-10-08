import express from 'express';
const router = express.Router();
import { authenticateToken } from '../../middlewares/auth.js';
import Chat from '../../models/Chat/Chat.js';
import Workspace from '../../models/Workspace/Workspace.js';

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

export default router;
