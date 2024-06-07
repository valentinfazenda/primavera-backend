import axios from 'axios';
import Step from '../../../../models/Step/Step.js';
import Document from '../../../../models/Document/Document.js';

async function executeStepLink(stepId, userId, input = '') {
  try {
    const step = await Step.findById(stepId);
    if (!step) {
      throw new Error("Step not found");
    }
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

export {
  executeStepLink,
};