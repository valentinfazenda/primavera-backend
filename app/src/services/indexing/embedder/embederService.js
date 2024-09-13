import Document from '../../../models/Document/Document.js';
import { spawn } from 'child_process';
import path from 'path';

// Function to embed chunks by calling the Python script
async function embedChunks(chunks) {
    return new Promise((resolve, reject) => {
        // Path to the Python script to be called
        const pythonScriptPath = path.join('app', 'src', 'services', 'indexing', 'embedder', 'generate_embedings.py');

        const pythonProcess = spawn('python', [pythonScriptPath]);

        let data = '';
        let errorData = '';

        pythonProcess.stdout.on('data', (chunk) => {
            data += chunk.toString(); // Collect the data as string
        });

        pythonProcess.stderr.on('data', (chunk) => {
            errorData += chunk.toString(); // Collect errors
        });

        pythonProcess.on('error', (error) => {
            console.error('Error executing Python script:', error);
            reject(error);
        });

        pythonProcess.on('close', (code) => {
            if (errorData) {
                //console.error(`Python script error: ${errorData}`);
            }
            if (code !== 0) {
                console.error(`Python process exited with code ${code}`);
                return reject(new Error(`Python process exited with code ${code}`));
            }

            try {
                // Parse the embeddings received from Python (assuming JSON)
                const embeddedChunks = JSON.parse(data);  // Ensure you parse the data
                resolve(embeddedChunks); // Return the parsed data
            } catch (error) {
                console.error('Error parsing data from Python script:', error);
                reject(error);
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

export {
    embedDocumentChunks,
    embedChunks
};
