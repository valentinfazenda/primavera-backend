"use server";
import express from 'express';
import axios from 'axios'; // Import axios to make HTTP requests
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
router.post('/add', authenticateToken, async (req, res) => {
    const { fileName, workspaceId } = req.body;

    // Validate input
    if (!fileName || !workspaceId) {
        return res.status(400).json({ error: "fileName and workspaceId are required" });
    }

    try {
        // Create a new document in the database
        const newDocument = new Document({
            name: fileName,
            workspaceId: workspaceId,
            status: 'created',
            createdAt: new Date()
        });

        // Save the document to the database
        const savedDocument = await newDocument.save();

        // Return success response with document details
        res.status(201).json({ 
            message: "Document created successfully", 
            id: savedDocument._id, 
            name: savedDocument.name, 
            status: savedDocument.status 
        });

    } catch (error) {
        console.error('Error saving document:', error);
        res.status(500).json({ error: error.message });
    }
});

// Obtain presigned URL
router.post('/generate-presigned-url', authenticateToken, async (req, res) => {
    const { fileName, fileType, workspaceId, title } = req.body;

    // Get the userId from the authenticated user
    const userId = req.user.id;

    try {
        // Define the key for the object in S3, including userId and workspaceId in the path
        const key = `documents/${userId}/${workspaceId}/${fileName}`;

        const fileext = title.split('.').pop();

        // Create the command for generating the presigned URL, including the workspaceId as metadata
        const command = new PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
            Metadata: {
                title,
                fileext
            }
        });

        // Generate the presigned URL, setting it to expire in 300 seconds (5 minutes)
        const url = await getSignedUrl(s3, command, { expiresIn: 300 });

        // Return the presigned URL to the client
        res.json({ url });
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        res.status(500).json({ error: 'Error generating presigned URL' });
    }
});


// Synchronize documents by workspaceId
router.post('/synchronize', authenticateToken, async (req, res) => {
    const { workspaceId } = req.body;
    const userId = req.user.id;

    if (!workspaceId) {
        return res.status(400).json({ error: 'workspaceId is required' });
    }

    try {
        // Find all documents with the given workspaceId, without fulltext and with status 'downloaded'
        const documents = await Document.find({
            workspaceId: workspaceId,
            fulltext: { $exists: false },
            status: 'created'
        });

        if (documents.length === 0) {
            return res.status(404).json({ error: 'No documents found matching the criteria' });
        }

        // Build the Records array
        const records = documents.map(doc => ({
            s3: {
                bucket: { name: process.env.AWS_BUCKET_NAME },
                object: { key: `documents/${userId}/${doc.workspaceId}/${doc.name}` }
            }
        }));

        // Prepare the body for the processDocument API
        const requestBody = {
            Records: records
        };

        console.log('Request body:', requestBody.Records[0]);

        // Forward the request body to the external service
        //axios.post('http://localhost:4200/processDocument', requestBody);

        // Send back the response from the external service to the client
        res.status(200).json({ message: 'Documents sent for syncronization successfully' });
    } catch (error) {
        console.error('Error synchronizing documents:', error);
        res.status(500).json({ error: 'Failed to synchronize documents' });
    }
});


export default router;
