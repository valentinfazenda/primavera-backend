import Document from '../../../models/Document/Document.js';
import { spawn } from 'child_process';
import path from 'path';

async function embedDocumentChunks(documentId) {
    return new Promise(async (resolve, reject) => {
        try {
            // Retrieve the document from the database using its ID
            const document = await Document.findById(documentId);

            if (!document) {
                return reject(new Error(`Document with ID ${documentId} not found`));
            }

            // Check if the 'chunks' field exists and contains data
            const { chunks } = document;
            if (!chunks || chunks.length === 0) {
                return reject(new Error(`No chunks found for the document with ID ${documentId}`));
            }

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

            // Handle errors from stdin
            pythonProcess.stdin.on('error', (err) => {
                console.error('Error writing to stdin:', err);
            });

            // Handle Python process execution errors
            pythonProcess.on('error', (error) => {
                console.error('Error executing Python script:', error);
                reject(error);
            });

            // Once the process is closed
            pythonProcess.on('close', async (code) => {
                if (errorData) {
                    console.error(`Python script error: ${errorData}`);
                }
                if (code !== 0) {
                    console.error(`Python process exited with code ${code}`);
                    return reject(new Error(`Python process exited with code ${code}`));
                }

                try {
                    // Parse the embeddings received from Python
                    const embededChunks = data;

                    // Update the document in the database with the generated embeddings
                    await Document.findByIdAndUpdate(documentId, { embededChunks });

                    console.log(`Embeddings successfully created for document ID: ${documentId}`);
                    resolve(); // Resolve the promise once the embedding is complete
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
                    pythonProcess.stdin.end();  // Close stdin after writing
                }
            });

        } catch (error) {
            console.error('Error in embedDocumentChunks:', error);
            reject(error); // Reject the promise in case of an error
        }
    });
}

export {
    embedDocumentChunks
};
