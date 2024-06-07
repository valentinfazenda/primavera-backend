import express from 'express';
const router = express.Router();
import multer from 'multer';
import { authenticateToken } from '../../middlewares/auth.js';
import { createDocument, processDocument } from '../../services/links/linksService.js';
import Document from '../../models/Document/Document.js';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Find a document by its ID
router.post('/find', authenticateToken, async (req, res) => {
    const documentId = req.body.id;
    try {
        const document = await Document.findById(documentId);
        if (!document) {
            return res.status(404).json({ error: "Document not found" });
        }
        res.status(200).json(document);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a document by its ID
router.delete('/delete', authenticateToken, async (req, res) => {
    const documentId = req.body.id;
    try {
        const deletedDocument = await Document.findByIdAndDelete(documentId);
        if (!deletedDocument) {
            return res.status(404).json({ error: "Document not found" });
        }
        res.status(200).json({ message: "Document deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Add a new document 
router.post('/add', authenticateToken, async (req, res) => {
    if (!req.body.url) {
        return res.status(400).json({ error: "No url uploaded" });
    }

    try {
        const savedURL = await createDocument(req.body.url,);
        res.status(201).json({ message: "URL processing started", id: savedURL._id, name: savedURL.name });
        processDocument(savedURL._id, req.body.url)
            .catch(err => console.error('Error processing URL in background:', err));
    } catch (error) {
        console.error('Error saving initial url:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
