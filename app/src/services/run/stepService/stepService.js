const axios = require('axios');
const Step = require('../../../models/Step/Step');
const { executeStepLlm } = require('./stepLlmService/stepLlmService');
const { executeStepDocument } = require('./stepDocumentService/stepDocumentService');
const { executeStepLink } = require('./stepLinkService/stepLinkService');

let stepDependencies = {};

async function executeStep(stepId, userId, input = '', socket = null) {
  try {
    const step = await Step.findById(stepId);
    if (!step) {
      throw new Error("Step not found");
    }

    if (!stepDependencies[stepId]) {
      stepDependencies[stepId] = {
        count: step.previousSteps.length,
        inputs: [],
        completed: false
      };
    }

    if (input !== '') {
      stepDependencies[stepId].inputs.push(input);
      stepDependencies[stepId].count--;
    }

    if (stepDependencies[stepId].count > 0) {
      return;
    }

    let response;
    if (step.type == "llm") {
      response = await executeStepLlm(stepId, userId, stepDependencies[stepId].inputs, socket, stepId);
    } else if (step.type == "document") {
      response = await executeStepDocument(stepId, userId, stepDependencies[stepId].inputs, socket);
    } else if (step.type == "link") {
      response = await executeStepLink(stepId, userId, stepDependencies[stepId].inputs, socket);
    } else {
      throw new Error("Step type not found");
    }

    stepDependencies[stepId].completed = true;
    delete stepDependencies[stepId];
    if (step.endingStep) {
      return response;
    } else {
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
