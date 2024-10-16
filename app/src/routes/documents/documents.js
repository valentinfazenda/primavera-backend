"use server";
import express from 'express';
const router = express.Router();
import multer from 'multer';
import { authenticateToken } from '../../middlewares/auth.js';
import { createDocument, processDocument } from '../../services/documents/documentsService.js';
import Document from '../../models/Document/Document.js';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3 from '../../config/aws.js';

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Find a document by its ID
router.post('/details', authenticateToken, async (req, res) => {
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

    try {
        const savedDocument = await createDocument(req.file.buffer, req.file.originalname);
        res.status(201).json({ message: "Document processing started", id: savedDocument._id, name: savedDocument.name });
        processDocument(savedDocument._id, req.file.buffer, savedDocument.extension)
            .catch(err => console.error('Error processing document in background:', err));
    } catch (error) {
        console.error('Error saving initial document:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtain presigned URL
router.post('/generate-presigned-url', authenticateToken, async (req, res) => {
    const { fileName, fileType, workspaceId } = req.body;

    const userId = req.user.id;

    try {
        const key = `documents/${userId}/${workspaceId}/${fileName}`;

        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        });

        const url = await getSignedUrl(s3, command, { expiresIn: 300 });

        res.json({ url });
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        res.status(500).json({ error: 'Error generating presigned URL' });
    }
});

export default router;