const fs = require('fs');
const axios = require('axios');
const pdf = require('pdf-poppler');
const Tesseract = require('tesseract.js');
const path = require('path');

async function downloadPDF(url, outputPath) {
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream'
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

async function convertPDFToImages(pdfPath, outputDir) {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const opts = {
    format: 'jpeg',
    out_dir: outputDir,
    out_prefix: path.basename(pdfPath, path.extname(pdfPath)),
    page: null
  };

  return pdf.convert(pdfPath, opts)
    .then(res => res)
    .catch(error => {
      console.error(error);
    });
}

async function ocrImage(imagePath) {
  return Tesseract.recognize(imagePath, 'eng', {
    logger: m => console.log(m)
  })
  .then(({ data: { text } }) => text);
}

async function DocumentOCR(url) {
  const pdfPath = path.resolve(__dirname, 'downloaded.pdf');
  const outputDir = path.resolve(__dirname, 'images');

  await downloadPDF(url, pdfPath);
  await convertPDFToImages(pdfPath, outputDir);

  const images = fs.readdirSync(outputDir).filter(file => file.endsWith('.jpg'));
  let ocrText = '';

  for (const image of images) {
    const text = await ocrImage(path.join(outputDir, image));
    ocrText += text + '\n';
  }

  return ocrText;
}

module.exports = {
  DocumentOCR
};
