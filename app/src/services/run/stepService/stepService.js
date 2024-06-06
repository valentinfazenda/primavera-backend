import axios from 'axios';
import Step from '../../../models/Step/Step.js';
import { executeStepLlm } from './stepLlmService/stepLlmService.js';
import { executeStepDocument } from './stepDocumentService/stepDocumentService.js';
import { executeStepLink } from './stepLinkService/stepLinkService.js';

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

export {
  executeStep,
};
