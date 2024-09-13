import Document from '../../../models/Document/Document.js';
import { spawn } from 'child_process';
import path from 'path';

// Function to embed chunks by calling the Python script
async function embedChunks(chunks) {
    return new Promise((resolve, reject) => {
        // Path to the Python script to be called, using path.join for cross-platform compatibility
        const pythonScriptPath = path.join('app', 'src', 'services', 'indexing', 'embedder', 'generate_embedings.py');

        // Spawn the Python process and pass the chunks as input
        const pythonProcess = spawn('python', [pythonScriptPath]);

        let data = '';
        let errorData = '';

        // Handle the JSON output from the Python script
        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString(); // Ensure that the chunk is treated as a string
        });

        // Capture errors from the Python process
        pythonProcess.stderr.on('data', (chunk) => {
            errorData += chunk.toString(); // Ensure that the chunk is treated as a string
        });

        // Handle Python process execution errors
        pythonProcess.on('error', (error) => {
            console.error('Error executing Python script:', error);
            reject(error);
        });

        // Once the process is closed
        pythonProcess.on('close', (code) => {
            if (errorData) {
                console.error(`Python script error: ${errorData}`);
            }
            if (code !== 0) {
                console.error(`Python process exited with code ${code}`);
                return reject(new Error(`Python process exited with code ${code}`));
            }

            try {
                // Parse the embeddings received from Python
                const embeddedChunks = data// Assume Python script returns JSON
                resolve(embeddedChunks); // Return the embedded chunks
            } catch (error) {
                console.error('Error parsing data from Python script:', error);
                reject(error); // Reject the promise in case of an error
            }
        });

        // Send the chunks to the Python script via stdin
        pythonProcess.stdin.write(JSON.stringify(chunks), (err) => {
            if (err) {
                console.error('Error writing data to stdin:', err);
                reject(err);
            } else {
                pythonProcess.stdin.end(); // Close stdin after writing
            }
        });
    });
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

        // Update the document in the database with the generated embeddings
        await Document.findByIdAndUpdate(documentId, { embeddedChunks });

        console.log(`Embeddings successfully created for document ID: ${documentId}`);
    } catch (error) {
        console.error('Error in embedDocumentChunks:', error);
        throw error; // Throw the error for further handling
    }
}

export {
    embedDocumentChunks,
    embedChunks
};
