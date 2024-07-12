import Step from '../../../../models/Step/Step.js';
import Document from '../../../../models/Document/Document.js';

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

    return `Document name: ${document.name} \n\n Document content:\n ${document.fulltext}`;

  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
}

export {
    executeStepDocument,
};