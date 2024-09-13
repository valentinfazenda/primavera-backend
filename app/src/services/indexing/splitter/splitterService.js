import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import Document from '../../../models/Document/Document.js';

// Function to process the document using content from a local file
async function splitDocumentToChunks(documentId) {
    try {
        if (!documentId) {
            throw new Error('No document ID provided');
        }

        // Fetch the document from MongoDB
        const doc = await Document.findById(documentId);
        if (!doc) {
            throw new Error('Document not found');
        }
        const fulltext = doc.fulltext; // Assuming 'fulltext' is the field name in your Document model
        
        // Split the fulltext into chunks
        //const textChunks = await splitTextIntoChunks(fulltext);
        const textChunks = await splitTextIntoSentences(fulltext);

        // Optionally update the document in the database with the chunks
        await Document.findByIdAndUpdate(documentId, { chunks: textChunks });
        console.log('Document processed successfully:', textChunks);
        
    } catch (error) {
        console.error('Error in processDocument:', error);
        throw error;
    }
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

// Function to split text into sentences
async function splitTextIntoSentences(text) {
    console.log('Splitting text into sentences...');
    
    // Regular expression to match sentence-ending punctuation: '.', '!', or '?'
    const sentenceSplitter = /(?<=[.!?])\s+/;
    
    // Split the text into an array of sentences
    const sentences = text.split(sentenceSplitter);
    
    console.log('Sentences:', sentences);
    return sentences;
}

export {
    splitDocumentToChunks
};
