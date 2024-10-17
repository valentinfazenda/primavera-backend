import { embedChunks } from '../indexing/embedder/embederService.js';
import axios from 'axios';
import Document from '../../models/Document/Document.js';
import Chunk from '../../models/Chunk/Chunk.js';

// Function to log the time difference between steps
let previousTime = Date.now();

function logTime(message) {
    const currentTime = Date.now();
    console.log(`${message} - Time elapsed: ${currentTime - previousTime} ms`);
    previousTime = currentTime; // Update the previous time
}

// Function to calculate similarity by calling the /calculate_similarity API
async function calculateSimilarity(phraseEmbedding, embeddedChunks) {
    try {
        const response = await axios.post('http://localhost:4200/calculate_similarity', {
            phraseEmbedding: phraseEmbedding,
            embeddedChunks: embeddedChunks
        });

        // Return the best match found by the API
        return response.data.chunks;
    } catch (error) {
        console.error('Error calling /calculate_similarity endpoint:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Service to search for the embedding of a given phrase
async function searchService(phrase, workspaceId) {
    try {
        logTime('Start process');

        // Step 1: Find all documents that have the provided workspaceId
        logTime('Fetching documents by workspaceId');
        const documents = await Document.find({ workspaceId: workspaceId }, { _id: 1 });
        logTime('Documents retrieved');

        if (!documents || documents.length === 0) {
            return [];
        }

        // Extract the documentIds from the retrieved documents and ensure they are ObjectId instances
        //const documentIds = documents.map(document => document._id);
        const documentIds = documents.map(doc => doc._id.toString()); // as documentId is not an ooid for now

        // DEBUG: Log the documentIds to check if they are correctly formatted
        console.log("Document IDs:", documentIds);

        // Step 2: Parallelize embedding generation and chunk retrieval
        logTime('Parallel execution of embedding generation and chunk retrieval');
        const [phraseEmbedded, chunks] = await Promise.all([
            embedChunks([phrase]),  // Generate the embeddings for the phrase
            Chunk.find({ documentId: { $in: documentIds } }, { embeddedChunk: 1 })  // Retrieve the chunks associated with the documentIds
        ]);
        logTime('Embeddings and chunks retrieved');

        if (!chunks || chunks.length === 0) {
            throw new Error('No embedded chunks found for the specified workspace');
        }

        // Prepare an array of the embedded chunks
        const chunksArray = chunks.map(chunk => chunk.embeddedChunk);

        // Step 3: Call the API to find the most similar chunk
        logTime('Start search');
        const mostSimilarChunks = await calculateSimilarity(phraseEmbedded, chunksArray);
        logTime('Search done');

        // Step 4: Find the chunks in the database that correspond to the most similar ones
        logTime('Fetching matched chunks from the database');
        const matchedChunks = await Chunk.find({
            embeddedChunk: { $in: mostSimilarChunks }
        }, { text: 1, documentId: 1 }); // Retrieve chunk text and documentId
        logTime('Matched chunks retrieved');

        // Return an array of objects containing chunk text and documentId
        const result = matchedChunks.map(chunk => ({
            chunkText: chunk.text,
            documentId: chunk.documentId
        }));

        return result;

    } catch (error) {
        console.error('Error in searchService:', error);
        throw error;
    }
}

export {
    searchService
};
