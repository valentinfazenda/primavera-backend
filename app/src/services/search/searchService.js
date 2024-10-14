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
        return response.data;
    } catch (error) {
        console.error('Error calling /calculate_similarity endpoint:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Service to search for the embedding of a given phrasfle
async function searchService(phrase) {
    try {
        logTime('Start process');

        // Exécuter les deux opérations en parallèle
        logTime('Generate embeddings and retrieve documents in parallel');
        const [phraseEmbedded, chunks] = await Promise.all([
            embedChunks([phrase]),
            Chunk.find({}, { embeddedChunk: 1 })
        ]);
        logTime('Embeddings generated and chunks retrieved');

        if (!chunks || chunks.length === 0) {
            throw new Error('No embeded chunks found');
        }

        // Step 3: store all chunks in an array (each chunks is an array of numbers)
        const chunksArray = chunks.map(chunk => chunk.embeddedChunk);

        // Step 4: Call the API to find the most similar chunk
        logTime('Start search');
        const mostSimilarChunks = await calculateSimilarity(phraseEmbedded, chunksArray); // return an array of chunks of lenght i
        logTime('Search done');

        // Step 5: Find in the chunks collection the corresponding chunks based on similarity
        // mostSimilarChunks is an array of indices or chunk data from the API
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

    } catch (error) {
        console.error('Error in searchService:', error);
        throw error;
    }
}

export {
    searchService
};
