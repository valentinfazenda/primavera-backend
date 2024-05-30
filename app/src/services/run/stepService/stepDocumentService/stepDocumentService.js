const axios = require('axios');
const Step = require('../../../../models/Step/Step');
const { DocumentOCR } = require('../../../documents/pdf/ocrService/ocrService');
const { processExcelBuffer } = require('../../../documents/xlsx/xlsxService');

async function executeStepDocument(stepId, userId, input = '') {
  try {
    const step = await Step.findById(stepId);
    if (!step) {
      throw new Error("Step not found");
    }

    if (step.docType = "pdf") {
        documentStr = DocumentOCR(step.docSource);
    }
    else if (step.docType = "xlsx") {
        documentStr = processExcelBuffer(step.docSource);
    }
    else {
        throw new Error("Doctype not supported");
    }

    const messages = [];
    if (input != '') {
        messages.push({
            role: "user",
            content: documentStr + input + "\n\n\nConsidering the above inputs the user wants to perform this task " + stepData + " Answer:"
        });
    } else {
        messages.push({
            role: "user",
            content: documentStr + "\n\n\nConsidering the above inputs the user wants to perform this task " + stepData + " Answer:"
        });
    }

    if (step.modelLlm = "AzureOpenAI") {
      return await sendMessageToAzureOpenAI(userId, messages, step.modelName);
    }
    else if (step.modelLlm = "OpenAI") {
        return await sendMessageToOpenAI(userId, messages, step.modelName);
    }
    else {
        throw new Error("Model not found");
    }

  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
}

module.exports = {
    executeStepDocument,
};