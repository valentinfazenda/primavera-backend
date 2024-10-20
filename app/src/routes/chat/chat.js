import express from 'express';
const router = express.Router();
import { ObjectId } from 'mongodb';
import { deleteChat, executeMessage } from '../../services/chat/chatService.js';
import { authenticateToken } from '../../middlewares/auth.js';
import Chat from '../../models/Chat/Chat.js';
import Workspace from '../../models/Workspace/Workspace.js';
import Message from '../../models/Message/Message.js';
import User from '../../models/User/User.js';
import Company from '../../models/Company/Company.js';
import Model from '../../models/Model/Model.js';
import mongoose from 'mongoose';

// Endpoint to add a new chat
router.post('/create', authenticateToken, async (req, res) => {
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

        // Find the user using workspace.userId
        const user = await User.findById(workspace.userId);
        if (!user) throw new Error('User not found');

        // Find the company using user.companyId
        const company = await Company.findById(user.companyId);
        if (!company) throw new Error('Company not found');

        // Find the model using company.id
        const model = await Model.findOne({ companyId: new ObjectId(company._id) });
        if (!model) throw new Error('Model not found');

        // Create a new chat associated with the workspace
        const newChat = new Chat({
            workspaceId,
            modelId: model._id,
            name: "New chat"
        });

        const savedChat = await newChat.save();
        res.status(201).json(savedChat); // Return the saved chat
    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to delete a chat
router.delete('/delete/:id', authenticateToken, async (req, res) => {
    const chatId = req.params.id;

    try {
        const result = await deleteChat(chatId, req.user.id);
        res.status(200).json(result);
    } catch (error) {
        console.error('Error deleting chat or messages:', error);
        // Handle specific errors
        if (error.message === "Chat not found") {
            res.status(404).json({ error: error.message });
        } else if (error.message === "Unauthorized access to this workspace") {
            res.status(403).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

// Endpoint to get chat details by ID
router.post('/details', authenticateToken, async (req, res) => {
    const { chatId } = req.body;  // Extract chatId from the request body

    try {
        // Verify if the chat exists in the database
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ error: "Chat not found" }); // Return 404 if the chat doesn't exist
        }

        // Retrieve the workspace associated with the chat and check if the user has access
        const workspace = await Workspace.findById(chat.workspaceId);
        if (!workspace || workspace.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized access to this workspace" }); // Return 403 if user doesn't own the workspace
        }

        // Retrieve all messages associated with this chat
        const messages = await Message.find({ chatId: chat._id }); // Fetch messages where chatId matches the chat's ID

        // Return both chat details and associated messages
        res.status(200).json({
            chat,     // Return chat details
            messages  // Return list of messages
        });
    } catch (error) {
        // Catch and log any errors during the process, returning a 500 error
        console.error('Error fetching chat details and messages:', error);
        res.status(500).json({ error: error.message });
    }
});


// Endpoint to list all chats associated with a specific workspace
router.post('/list', authenticateToken, async (req, res) => {
    const { workspaceId } = req.body;

    try {
        if (!workspaceId) {
            const workspaces = await Workspace.find({ userId: req.user.id });
            const workspaceIds = workspaces.map(workspace => workspace._id);
            const chats = await Chat.find({ workspaceId: { $in: workspaceIds } });
            return res.status(200).json(chats);
        }
        else {
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
        }

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

router.post('/message', authenticateToken, async (req, res) => {
    const {chatId, message} = req.body;

    const result = await executeMessage(message, chatId, req.user.id);
    res.status(200).json({ message: result });
});


export default router;
