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

    const name = req.file.originalname;
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
    if (!name || !extension) {
        return res.status(400).json({ error: "Name and file type are required" });
    }

    const newDocument = new Document({
        name,
        fulltext: "", // Will be updated after processing
        extension
    });

    let savedDocument;
    try {
        savedDocument = await newDocument.save();
        res.status(201).json({ message: "Document processing started", id: savedDocument._id, name: savedDocument.name });
    } catch (error) {
        console.error('Error saving initial document:', error);
        return res.status(500).json({ error: "Error saving document" });
    }

    processDocument(savedDocument._id, buffer, extension);
});

async function processDocument(documentId, buffer, extension) {
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
                console.log("Unsupported file format");
                return;
        }
        await Document.findByIdAndUpdate(documentId, { fulltext });
        console.log("Document updated successfully with full text.");
    } catch (error) {
        console.error('Error processing document in background:', error);
    }
}

module.exports = router;
