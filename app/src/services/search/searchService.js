import { embedChunks } from '../indexing/embedder/embederService.js';
import axios from 'axios';
import Document from '../../models/Document/Document.js';

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

// Service to search for the embedding of a given phrase
async function searchService(phrase) {
    try {
        logTime('Start process');

        // Exécuter les deux opérations en parallèle
        logTime('Generate embeddings and retrieve documents in parallel');
        const [phraseEmbedding, documents] = await Promise.all([
            embedChunks([phrase]),
            Document.find({}, { embeddedChunks: 1, name: 1 })
        ]);
        logTime('Embeddings generated and documents retrieved');

        if (!documents || documents.length === 0) {
            throw new Error('No documents found with embedded chunks');
        }

        // Step 3: For each document, retrieve embeddedChunks and store them in a single array
        logTime('Retrieve all embedded chunks');
        let allEmbeddedChunks = [];
        documents.forEach(doc => {
            allEmbeddedChunks = allEmbeddedChunks.concat(doc.embeddedChunks);
        });
        logTime('All embedded chunks retrieved');

        // Step 4: Call the API to find the most similar chunk
        logTime('Start search');
        const mostSimilarChunk = await calculateSimilarity(phraseEmbedding, allEmbeddedChunks);
        logTime('Search done');

        // Step 5: Find the document that contains the most similar chunk
        let matchingDocument = null;
        const parsedMostSimilarChunk = mostSimilarChunk;

        for (const document of documents) {
            if (document.embeddedChunks.some(chunk => arraysEqual(chunk, parsedMostSimilarChunk.chunk))) {
                matchingDocument = document;
                break;
            }
        }

        if (!matchingDocument) {
            throw new Error('No matching document found for the most similar chunk.');
        }

        // Return the name of the document that contains the most similar chunk
        return matchingDocument.name;

    } catch (error) {
        console.error('Error in searchService:', error);
        throw error;
    }
}

// Function to compare two arrays (helper function)
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }

    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
            return false;
        }
    }

    return true;
}

export {
    searchService
};
