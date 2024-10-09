import express from 'express';
const router = express.Router();
import { authenticateToken } from '../../middlewares/auth.js';
import Workspace from '../../models/Workspace/Workspace.js';


router.get('/list', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const workspaces = await Workspace.find({ userId });
        res.status(200).json(workspaces);
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

        res.status(200).json(workspace);
    } catch (error) {
        console.error('Error finding workspace:', error);
        res.status(500).json({ error: error.message });
    }
});


router.delete('/delete', authenticateToken, async (req, res) => {
    const { id } = req.body;

    try {
        const workspace = await Workspace.findById(id);

        if (!workspace) {
            return res.status(404).json({ error: "Workspace not found" });
        }

        if (workspace.userId.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized access" });
        }

        await Workspace.findByIdAndDelete(id);
        res.status(200).json({ message: "Workspace deleted successfully" });
    } catch (error) {
        console.error('Error deleting workspace:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/add', authenticateToken, async (req, res) => {
    const { name } = req.body;

    try {
        const newWorkspace = new Workspace({
            name,
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
