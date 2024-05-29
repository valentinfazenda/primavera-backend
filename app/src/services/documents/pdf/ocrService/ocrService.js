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

    const images = [];
    const options = {
      density: 100,
      format: "png",
      width: 800,
      height: 1120
    };
    const converter = fromBuffer(pdfBuffer, options);

    for (let i = 1; i <= numPages; i++) {
      console.log(`Converting page ${i} to image...`);
      const page = await converter(i, { responseType: "base64" });
      if (!page || !page.base64) {
        console.error(`Failed to convert page ${i} to image: Base64 data is undefined`);
        continue;
      }
      const filename = uuidv4() + '.png';
      const filePath = path.join(tempDir, filename);
      fs.writeFileSync(filePath, page.base64, 'base64');
      console.log(`Page ${i} converted successfully and saved as ${filename}`);
      images.push(filePath);
    }

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

    let ocrText = '';
    for (const imagePath of images) {
      const text = await ocrImage(imagePath);
      ocrText += text + '\n';
    }

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
