import axios from 'axios';
import cheerio from 'cheerio';

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

// Function to process the URL and return text content
async function extractTextFromURL(url) {
    try {
        if (!url) {
            throw new Error('URL is undefined');
        }
        const html = await fetchHTML(url);
        const text = extractTextFromHTML(html);
        return text;
    } catch (error) {
        console.error('Error in extractTextFromURL:', error);
        throw error;
    }
}

export {
    extractTextFromURL
};
