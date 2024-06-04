const axios = require('axios');
const Step = require('../../../../models/Step/Step');
const Document = require('../../../../models/Document/Document');
const { convertPDFBufferToText } = require('../../../documents/pdf/ocrService/ocrService');
const { processExcelBuffer } = require('../../../documents/xlsx/xlsxService');

async function executeStepDocument(stepId, userId, input = '') {
  try {
    const step = await Step.findById(stepId);
    if (!step) {
      throw new Error("Step not found");
    }
    // search in the fulltext value of the document (in the documents tab) corresponding to step.documentId
    const document = await Document.findById(step.documentId);
    if (!document) {
      throw new Error("Document not found");
    }
    const documentStr = document.fulltext;

    return documentStr;

  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
}

module.exports = {
    executeStepDocument,
};