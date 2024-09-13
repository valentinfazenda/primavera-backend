import { embedChunks } from '../indexing/embedder/embederService.js';
import { spawn } from 'child_process';
import path from 'path';
import Document from '../../models/Document/Document.js';

// Function to calculate similarity using Python script
async function calculateSimilarity(phraseEmbedding, embeddedChunks) {
    return new Promise((resolve, reject) => {
        const pythonScriptPath = path.join('app', 'src', 'services', 'search', 'calculate_similarity.py');
        const pythonProcess = spawn('python', [pythonScriptPath]);

        let data = '';
        let errorData = '';

        // Handle the JSON output from the Python script
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString();
        });

        // Capture errors from the Python process
        pythonProcess.stderr.on('data', (chunk) => {
            errorData += chunk.toString();
        });

        // Handle errors from the Python process
        pythonProcess.on('error', (error) => {
            console.error('Error executing Python script:', error);
            reject(error);
        });

        // Once the process is closed
        pythonProcess.on('close', (code) => {
            if (errorData) {
                //console.error(`Python script error: ${errorData}`);
            }
            if (code !== 0) {
                console.error(`Python process exited with code ${code}`);
                return reject(new Error(`Python process exited with code ${code}`));
            }

            try {
                const bestMatch = data;
                resolve(bestMatch); // Return the best match found by the Python script
            } catch (error) {
                console.error('Error parsing data from Python script:', error);
                reject(error);
            }
        });

        // Send the embeddings to the Python script via stdin
        const payload = JSON.stringify({
            phraseEmbedding,
            embeddedChunks
        });

        pythonProcess.stdin.write(payload, (err) => {
            if (err) {
                console.error('Error writing data to stdin:', err);
                reject(err);
            } else {
                pythonProcess.stdin.end(); // Close stdin after writing
            }
        });
    });
}

// Service to search for the embedding of a given phrase
async function searchService(phrase) {
    try {
        // Validate the input
        if (!phrase || typeof phrase !== 'string') {
            throw new Error('Invalid input: a valid phrase is required');
        }

        // Step 1: Embed the phrase
        const phraseEmbedding = await embedChunks(phrase);

        // Step 2: Retrieve all documents with embedded chunks from MongoDB
        const documents = await Document.find({}, { embeddedChunks: 1, name: 1 });

        if (!documents || documents.length === 0) {
            throw new Error('No documents found with embedded chunks');
        }

        // Step 3: For each document, retrieve embeddedChunks and store them in a single array
        let allEmbeddedChunks = [];
        documents.forEach(doc => {
            allEmbeddedChunks = allEmbeddedChunks.concat(doc.embeddedChunks);
        });

        // Step 4: Call Python script to find the most similar chunk
        const mostSimilarChunk = await calculateSimilarity(phraseEmbedding, allEmbeddedChunks);


        // Step 5: Find the document that contains the most similar chunk
        let matchingDocument = null;

        const parsedMostSimilarChunk = JSON.parse(mostSimilarChunk);

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