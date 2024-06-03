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
      response = await executeStepLlm(stepId, userId, input, socket);
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
    if (socket) {
      socket.emit('answer', {stepId: stepId, response: response});
      if (step.endingStep) {
        return response;
      } else {
        if (!step.nextStep) {
          throw new Error("No next step defined");
        }
        return await executeStep(step.nextStep, userId, response, socket);
      }
    } else {
      if (step.endingStep) {
        return response;
      } else {
        if (!step.nextStep) {
          throw new Error("No next step defined");
        }
        return await executeStep(step.nextStep, userId, response);
      }
    }

  } catch (error) {
    console.error(error);
    throw new Error("Failed to execute step: " + error.message);
  }
}

module.exports = {
  executeStep,
};
