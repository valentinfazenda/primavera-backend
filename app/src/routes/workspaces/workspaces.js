import express from 'express';
const router = express.Router();
import { authenticateToken } from '../../middlewares/auth.js';
import Workspace from '../../models/Workspace/Workspace.js';
import Chat from '../../models/Chat/Chat.js';
import Document from '../../models/Document/Document.js';

router.get('/list', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const workspaces = await Workspace.find({ userId });

        const workspacesDetails = await Promise.all(workspaces.map(async (workspace) => {
            const chats = await Chat.find({ workspaceId: workspace._id }).select('_id');
            const documents = await Document.find({ workspaceId: workspace._id }).select('_id');
            return {
                ...workspace.toObject(),
                chats: chats.map(chat => chat._id),
                documents: documents.map(doc => doc._id)
            };
        }));

        res.status(200).json(workspacesDetails);
    } catch (error) {
        console.error('Error fetching workspaces:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/details', authenticateToken, async (req, res) => {
    const { id } = req.body;

    try {
        const workspace = await Workspace.findById(id);

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        if (workspace.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized access" });
        }

        const documents = await Document.find({ workspaceId: workspace._id }).select('name status');

        const chats = await Chat.find({ workspaceId: workspace._id }).select('name');

        const workspaceDetails = {
            ...workspace.toObject(),
            documents,
            chats: chats.map(chat => chat.toObject())
        };

        res.status(200).json(workspaceDetails);
    } catch (error) {
        console.error('Error finding workspace:', error);
        res.status(500).json({ error: error.message });
    }
});


router.delete('/delete/:id', authenticateToken, async (req, res) => {
    const id = req.params.id;

    try {
        const workspace = await Workspace.findById(id);
        
        // Ensure the workspace exists
        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        // Ensure the user is authorized to delete this workspace
        if (workspace.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized access" });
        }

        // Call the service to delete the workspace and all its associated data
        const result = await deleteWorkspaceById(id);

        // Return success with details of deleted entities
        res.status(200).json({
            message: "Workspace, documents, and chats deleted successfully",
            deletedWorkspace: result.deletedWorkspace,
            deletedDocumentsCount: result.deletedDocumentsCount,
            deletedChatsCount: result.deletedChatsCount
        });
    } catch (error) {
        console.error('Error deleting workspace:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/create', authenticateToken, async (req, res) => {

    try {
        const newWorkspace = new Workspace({
            name: "New workspace",
            userId: req.user.id 
        });

        const savedWorkspace = await newWorkspace.save();
        res.status(201).json(savedWorkspace);
    } catch (error) {
        console.error('Error creating workspace:', error);
        res.status(500).json({ error: error.message });
    }
});


export default router;
