import { PYTHON_API_URL } from '../../../config/endpoints.js';
import Document from '../../../models/Document/Document.js';
import axios from 'axios';

// Function to embed chunks by calling the /embed API
async function embedChunks(chunks) {
    try {
        // Send POST request to the /embed endpoint
        const response = await axios.post(`${PYTHON_API_URL}/embed`, {
            sentences: chunks,
        });

        // Return the embeddings from the API response
        return response.data.embeddings;
    } catch (error) {
        console.error('Error calling /embed endpoint:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Function to embed document chunks
async function embedDocumentChunks(documentId) {
    try {
        // Retrieve the document from the database using its ID
        const document = await Document.findById(documentId);

        if (!document) {
            throw new Error(`Document with ID ${documentId} not found`);
        }

        // Check if the 'chunks' field exists and contains data
        const { chunks } = document;
        if (!chunks || chunks.length === 0) {
            throw new Error(`No chunks found for the document with ID ${documentId}`);
        }

        // Call the embedChunks function to embed the chunks
        const embeddedChunks = await embedChunks(chunks);

        // Parse and convert the embedded chunks to numbers (if necessary)
        const numericEmbeddings = embeddedChunks.map(chunk => chunk.map(Number));

        // Update the document in the database with the generated embeddings
        await Document.findByIdAndUpdate(documentId, { embeddedChunks: numericEmbeddings });

        console.log(`Embeddings successfully created for document ID: ${documentId}`);
    } catch (error) {
        console.error('Error in embedDocumentChunks:', error);
        throw error;
    }
}

// Function to embed document chunks
async function embedAllDocumentsChunks() {
    try {
        // Retrieve all documents from the database
        const documents = await Document.find({});

        if (!documents || documents.length === 0) {
            throw new Error('No documents found');
        }

        // Create an array of promises for embedding document chunks in parallel
        const embeddingPromises = documents.map(async (document) => {
            // Check if the 'chunks' field exists and contains data
            const { chunks } = document;
            if (!chunks || chunks.length === 0) {
                console.warn(`No chunks found for document ID: ${document._id}`);
                return null; // Skip processing for this document
            }

            // Call the embedChunks function to embed the chunks
            const embeddedChunks = await embedChunks(chunks);

            // Parse and convert the embedded chunks to numbers (if necessary)
            const numericEmbeddings = embeddedChunks.map(chunk => chunk.map(Number));

            // Update the document in the database with the generated embeddings
            await Document.findByIdAndUpdate(document._id, { embeddedChunks: numericEmbeddings });

            console.log(`Embeddings successfully created for document ID: ${document._id}`);
        });

        // Wait for all embedding tasks to complete
        await Promise.all(embeddingPromises);

        console.log('All documents processed for embeddings.');
    } catch (error) {
        console.error('Error in embedAllDocumentChunks:', error);
        throw error;
    }
}

export {
    embedDocumentChunks,
    embedAllDocumentsChunks,
    embedChunks
};
