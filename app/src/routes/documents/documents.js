const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken } = require('../../middlewares/auth');
const { convertPDFBufferToText } = require('../../services/documents/pdf/ocrService/ocrService');
const Document = require('../../models/Document/Document');

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
router.post('/add', authenticateToken, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }

    const { name } = req.body;
    const buffer = req.file.buffer;

    // Dynamically import the fileType module
    let fileType;
    try {
        fileType = await import('file-type');
    } catch (error) {
        console.error('Failed to load file-type module:', error);
        return res.status(500).json({ error: "Server error" });
    }

    // Detect file type and extension using the dynamically imported fileType
    let extension;
    const type = await fileType.fileTypeFromBuffer(buffer);
    if (type) {
        extension = type.ext;
    } else {
        return res.status(400).json({ error: "Failed to detect file type" });
    }

    let fulltext = '';
    try {
        switch (extension) {
            case "pdf":
                fulltext = await convertPDFBufferToText(buffer);
                break;
            case "xlsx":
                fulltext = 'Parsed xlsx content';
                break;
            default:
                throw new Error("Format not supported");
        }
    } catch (error) {
        console.error('Error processing document:', error);
        return res.status(500).json({ error: error.message });
    }

    if (!name || !fulltext || !extension) {
        return res.status(400).json({ error: "All fields (name, fulltext, extension) are required" });
    }

    try {
        const newDocument = new Document({
            name,
            fulltext,
            extension
        });
        const savedDocument = await newDocument.save();
        res.status(201).json(savedDocument);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
