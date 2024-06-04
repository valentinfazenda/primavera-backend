const axios = require('axios');
const Step = require('../../../models/Step/Step');
const { executeStepLlm } = require('./stepLlmService/stepLlmService');
const { executeStepDocument } = require('./stepDocumentService/stepDocumentService');
const { executeStepLink } = require('./stepLinkService/stepLinkService');

async function executeStep(stepId, userId, input = '', socket = null) {
  try {
    const step = await Step.findById(stepId);
    if (!step) {
      throw new Error("Step not found");
    }

    if (step.type == "llm") {
      response = await executeStepLlm(stepId, userId, input, socket, stepId);
    }
    else if (step.type == "document") {
      response = await executeStepDocument(stepId, userId, input, socket);
    }
    else if (step.type == "link") {
      response = await executeStepLink(stepId, userId, input, socket);
    }
    else {
      throw new Error("Step type not found");
    }

    if (step.endingStep) {
      return response;
    } else {
      if (!step.nextSteps || step.nextSteps.length === 0) {
        throw new Error("No next steps defined");
      }

      // Execute multiple next steps in parallel
      const nextStepPromises = step.nextSteps.map(nextStepId =>
        executeStep(nextStepId, userId, response, socket)
      );
      return await Promise.all(nextStepPromises);
    }

  } catch (error) {
    console.error(error);
    throw new Error("Failed to execute step: " + error.message);
  }
}

module.exports = {
  executeStep,
};
