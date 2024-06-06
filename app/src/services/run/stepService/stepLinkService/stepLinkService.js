import axios from 'axios';
import Step from '../../../../models/Step/Step.js';
import { extractTextFromURL } from '../../../links/linkService.js';
import { DocumentOCR } from '../../../documents/pdf/ocrService/ocrService_old.js';

async function executeStepLink(stepId, userId, input = '') {
  try {
    const step = await Step.findById(stepId);
    if (!step) {
      throw new Error("Step not found");
    }

    if (step.url.endwith("pdf")) {
        documentStr = DocumentOCR(step.url);
    }
    else {
        documentStr = extractTextFromURL(step.url);
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

export {
  executeStepLink,
};