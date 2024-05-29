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
    console.log(`Number of pages in PDF: ${numPages}`);
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-images-'));

    const options = {
      density: 100,
      format: "png",
      width: 800,
      height: 1120
    };
    const converter = fromBuffer(pdfBuffer, options);

    const conversionPromises = Array.from({ length: numPages }, async (_, i) => {
      const pageIndex = i + 1;
      const page = await converter(pageIndex, { responseType: "base64" });
      if (!page) {
        console.error(`Failed to convert page ${pageIndex} to image: Page data is undefined`);
        return null;
      }
      if (!page || !page.base64) {
        console.error(`Failed to convert page ${pageIndex} to image: Base64 data is undefined`);
        return null;
      }
      const filename = uuidv4() + '.png';
      const filePath = path.join(tempDir, filename);
      fs.writeFileSync(filePath, page.base64, 'base64');
      return filePath;
    });

    const images = (await Promise.all(conversionPromises)).filter(Boolean);
    return { images, tempDir };
  } catch (error) {
    console.error('Error converting PDF to images:', error);
    throw error;
  }
}

// Function to perform OCR on an image file
async function ocrImage(imagePath) {
  try {
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
    const ocrResults = await Promise.all(ocrPromises);

    const ocrText = ocrResults.join('\n');

    cleanupTempDir(tempDir);
    return ocrText;
  } catch (error) {
    console.error('Error in DocumentOCR:', error);
    throw error;
  }
}

// Function to clean up the temporary directory
function cleanupTempDir(tempDir) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}

module.exports = {
  DocumentOCR
};

// Additional logging to troubleshoot Heroku-specific issues
console.log('Environment:', process.env.NODE_ENV);
console.log('Temp Directory:', os.tmpdir());
