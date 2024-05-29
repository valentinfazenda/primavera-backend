const axios = require('axios');
const { PDFDocument } = require('pdf-lib');
const { fromBuffer } = require('pdf2pic');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Function to download PDF from a URL
async function downloadPDF(url) {
  try {
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'arraybuffer'
    });

    if (!response.data) {
      throw new Error('Failed to download PDF: response data is undefined');
    }

    console.log('PDF downloaded successfully.');
    return response.data;
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}

// Function to convert PDF buffer to images, save them temporarily, and return file paths
async function convertPDFToImages(pdfBuffer) {
  try {
    if (!pdfBuffer) {
      throw new Error('PDF buffer is undefined');
    }

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const numPages = pdfDoc.getPageCount();
    const tempDir = fs.mkdtempSync(path.join(__dirname, 'pdf-images-'));

    const options = {
      density: 100,
      format: "png",
      width: 800,
      height: 1120
    };
    const converter = fromBuffer(pdfBuffer, options);

    // Create an array of promises for converting each page
    const conversionPromises = Array.from({ length: numPages }, async (_, i) => {
      const pageIndex = i + 1;
      console.log(`Converting page ${pageIndex} to image...`);
      const page = await converter(pageIndex, { responseType: "base64" });
      if (!page || !page.base64) {
        console.error(`Failed to convert page ${pageIndex} to image: Base64 data is undefined`);
        return null;  // Return null if conversion fails, which must be handled later
      }
      const filename = uuidv4() + '.png';
      const filePath = path.join(tempDir, filename);
      fs.writeFileSync(filePath, page.base64, 'base64');
      console.log(`Page ${pageIndex} converted successfully and saved as ${filename}`);
      return filePath;
    });

    // Wait for all page conversion promises to resolve
    const images = (await Promise.all(conversionPromises)).filter(Boolean);  // Filter out any null results from failed conversions

    return { images, tempDir };
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    throw error;
  }
}

// Function to perform OCR on an image file
async function ocrImage(imagePath) {
  try {
    console.log('Performing OCR on image at ' + imagePath);
    return await Tesseract.recognize(imagePath, 'eng').then(({ data: { text } }) => text);
  } catch (error) {
    console.error('Error performing OCR on image:', error);
    throw error;
  }
}

// Function to process OCR on PDF document from URL and clean up afterward
async function DocumentOCR(url) {
  try {
    if (!url) {
      throw new Error('URL is undefined');
    }

    const pdfBuffer = await downloadPDF(url);
    const { images, tempDir } = await convertPDFToImages(pdfBuffer);

    const ocrPromises = images.map(imagePath => ocrImage(imagePath));

    // Use Promise.all to process all OCR operations in parallel
    const ocrResults = await Promise.all(ocrPromises);

    // Combine all OCR text into a single string
    const ocrText = ocrResults.join('\n');

    cleanupTempDir(tempDir); // Clean up the temporary files after processing
    return ocrText;
  } catch (error) {
    console.error('Error in DocumentOCR:', error);
    throw error;
  }
}

// Function to clean up the temporary directory
function cleanupTempDir(tempDir) {
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log(`Temporary directory ${tempDir} has been removed.`);
}

module.exports = {
  DocumentOCR
};
