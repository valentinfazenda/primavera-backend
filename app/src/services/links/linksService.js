import Document from '../../models/Document/Document.js';
import axios from 'axios';
import cheerio from 'cheerio';

async function createDocument(url) {

    let extension = 'html';

    const newDocument = new Document({
        name: url,
        fulltext: "", // Will be updated after processing
        extension
    });

    const savedDocument = await newDocument.save();
    return savedDocument;
}

// Function to process the URL and return text content
async function processDocument(documentId, url) {
    try {
        if (!url) {
            throw new Error('URL is undefined');
        }
        const html = await fetchHTML(url);
        const fulltext = extractTextFromHTML(html);
        await Document.findByIdAndUpdate(documentId, { fulltext });
    } catch (error) {
        console.error('Error in processDocument:', error);
        throw error;
    }
}

// Function to fetch HTML from a URL
async function fetchHTML(url) {
    try {
        const response = await axios.get(url);
        return response.data;  // Return HTML content
    } catch (error) {
        console.error('Error fetching HTML:', error);
        throw error;
    }
}

// Function to extract text from HTML
function extractTextFromHTML(html) {
    const $ = cheerio.load(html);
    let text = '';
    $('body').find('*').each(function() {
        if (!$(this).children().length) { 
            text += $(this).text() + '\n';
        }
    });
    return text.trim();
}

export {
    createDocument,
    processDocument
  };
