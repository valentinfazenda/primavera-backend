"use server";
import express from 'express';
import axios from 'axios'; // Import axios to make HTTP requests
const router = express.Router();
import multer from 'multer';
import { authenticateToken } from '../../middlewares/auth.js';
import Document from '../../models/Document/Document.js';
import Chunk from '../../models/Chunk/Chunk.js';
import { deleteDocument } from '../../services/documents/documentsService.js';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import s3 from '../../config/aws.js';
import mongoose from 'mongoose';
import { PYTHON_API_URL } from '../../config/endpoints.js';

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

router.delete('/delete/:id', authenticateToken, async (req, res) => {
    const documentId = req.params.id;

    try {
        // Call the deleteDocument service function
        const result = await deleteDocument(documentId);

        // Respond with success message and details
        res.status(200).json({
            message: "Document and associated chunks deleted successfully",
            deletedDocument: result.deletedDocument,
            deletedChunks: result.deletedChunksCount,
        });
    } catch (error) {
        console.error('Error deleting document or chunks:', error);

        // Handle specific errors
        if (error.message === "Document not found" || error.message === "Workspace not found") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: error.message });
        }
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
            status: 'uploading',
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
            status: 'uploading'
        });

        if (documents.length === 0) {
            return res.status(200).json({ error: 'No documents found matching the criteria' });
        }

        const validDocuments = [];

        // Check each document's availability on S3 using HeadObjectCommand
        for (const doc of documents) {
            const s3Params = {
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: `documents/${userId}/${doc.workspaceId}/${doc._id}`
            };

            try {
                // Check if the document exists on S3 using HeadObjectCommand
                const headObjectCommand = new HeadObjectCommand(s3Params);
                await s3.send(headObjectCommand); // Utilise l'instance S3 configurée pour envoyer la commande
                // If the object exists, add it to the validDocuments array
                validDocuments.push(doc);
            } catch (error) {
                console.error(`Document ${doc.name} not found on S3`);
                // Skip the document if it's not found on S3
            }
        }

        if (validDocuments.length === 0) {
            return res.status(404).json({ error: 'No valid documents found on S3' });
        }

        // Build the records array for valid documents
        const records = validDocuments.map(doc => ({
            s3: {
                bucket: { name: process.env.AWS_BUCKET_NAME },
                object: { key: `documents/${userId}/${doc.workspaceId}/${doc._id}` }
            }
        }));

        // Prepare the body for the processDocument API
        const requestBody = {
            records: records
        };

        // Forward the request body to the external service
        axios.post(`${PYTHON_API_URL}/processDocument`, requestBody);

        // Update the status of the valid documents to 'processing'
        await Document.updateMany(
            {
                _id: { $in: validDocuments.map(doc => doc._id) },
                status: 'uploading'
            },
            { $set: { status: 'processing' } }
        );

        // Send back the response from the external service to the client
        res.status(200).json({ message: 'Documents synchronized successfully' });
    } catch (error) {
        console.error('Error synchronizing documents:', error);
        res.status(500).json({ error: 'Failed to synchronize documents' });
    }
});

router.get('/download-fulltext/:id', authenticateToken, async (req, res) => {
    const documentId = req.params.id;

    try {
        // Find the document by ID
        const document = await Document.findById(documentId);

        if (!document || !document.fulltext) {
            return res.status(404).json({ error: "Document or fulltext not found" });
        }

        // Set headers for file download
        res.setHeader('Content-Disposition', 'attachment; filename=fulltext.txt');
        res.setHeader('Content-Type', 'text/plain');

        // Send the fulltext field content as the response
        res.send(document.fulltext);
    } catch (error) {
        console.error('Error fetching fulltext:', error);
        res.status(500).json({ error: 'Failed to download fulltext' });
    }
});

export default router;
