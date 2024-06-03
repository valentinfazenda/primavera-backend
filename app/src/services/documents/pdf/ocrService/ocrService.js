const { PDFDocument } = require('pdf-lib');
const { fromBuffer } = require('pdf2pic');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Convert PDF Buffer to Images and return text
async function convertPDFBufferToText(pdfBuffer) {
  try {
    if (!pdfBuffer) {
      throw new Error('PDF buffer is undefined');
    }

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const numPages = pdfDoc.getPageCount();
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

    // Perform OCR on the images
    const ocrPromises = images.map(imagePath => Tesseract.recognize(imagePath, 'eng'));
    const ocrResults = await Promise.all(ocrPromises);

    const ocrText = ocrResults.map(result => result.data.text).join('\n');

    // Clean up temporary files
    fs.rmSync(tempDir, { recursive: true, force: true });

    return ocrText;
  } catch (error) {
    console.error('Error converting PDF buffer to text:', error);
    throw error;
  }
}


module.exports = {
  convertPDFBufferToText
};