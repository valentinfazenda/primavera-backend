const Document = require('../../models/Document/Document');
const { convertPDFBufferToText } = require('./pdf/ocrService/ocrService');
const { convertExcelBufferToText } = require('./xlsx/xlsxService');

async function createDocument(fileBuffer, originalName) {

    let fileType;
    try {
        fileType = await import('file-type');
    } catch (error) {
        console.error('Failed to load file-type module:', error);
        return res.status(500).json({ error: "Server error" });
    }

    // Detect file type and extension using the dynamically imported fileType
    let extension;
    const type = await fileType.fileTypeFromBuffer(fileBuffer);
    if (type) {
        extension = type.ext;
    } else {
        return res.status(400).json({ error: "Failed to detect file type" });
    }

    const newDocument = new Document({
        name: originalName,
        fulltext: "", // Will be updated after processing
        extension
    });

    const savedDocument = await newDocument.save();
    return savedDocument;
}

async function processDocument(documentId, buffer, extension) {
    let fulltext = '';
    switch (extension) {
        case "pdf":
            fulltext = await convertPDFBufferToText(buffer);
            break;
        case "xlsx":
            fulltext = await convertExcelBufferToText(buffer);
            break;
        default:
            console.log("Unsupported file format");
            return;
    }
    await Document.findByIdAndUpdate(documentId, { fulltext });
}

module.exports = {
    createDocument,
    processDocument
  };
