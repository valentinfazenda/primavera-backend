import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { promises as fs } from 'fs'; 

// Function to process the document using content from a local file
async function splitDocumentToChunks(documentId = null) {
    try {
        // Read the content of the file from app\assets\document_to_split.txt
        const filePath = '.\\app\\assets\\document_to_split.txt';
        const fulltext = await fs.readFile(filePath, 'utf-8'); // Read file as string
        
        // Split the fulltext into chunks
        const textChunks = await splitTextIntoChunks(fulltext); // Ensure to await the result if necessary

        // Update the document in the database with fulltext and chunks
        console.log('Document processed successfully:', textChunks);
        //await Document.findByIdAndUpdate(documentId, { fulltext, chunks: textChunks });
        
    } catch (error) {
        console.error('Error in processDocument:', error);
        throw error;
    }
    return;
}

// Function to split text into chunks using Langchain's RecursiveCharacterTextSplitter
async function splitTextIntoChunks(text) { // Mark function as async if the splitting is asynchronous
    // Use Langchain's RecursiveCharacterTextSplitter
    console.log('Splitting text into chunks...');
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 6000,  // Maximum number of characters per chunk
        chunkOverlap: 200  // Number of characters overlapping between chunks
    });
    console.log('Splitter:', splitter);

    const chunks = splitter.splitText(text); // Await this call if it's asynchronous
    console.log('Chunks:', chunks);
    return chunks;  // Returns an array of chunks
}

export {
    splitDocumentToChunks
};
