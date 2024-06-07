import axios from 'axios';
import Step from '../../../models/Step/Step.js';
import Historical_run from '../../../models/Historical_run/Historical_run.js';
import { executeStepLlm } from './stepLlmService/stepLlmService.js';
import { executeStepDocument } from './stepDocumentService/stepDocumentService.js';
import { executeStepLink } from './stepLinkService/stepLinkService.js';

// Main function to execute a step
async function executeStep(runId, stepId, userId, socket = null) {
  try {
    const step = await Step.findById(stepId);
    if (!step) throw new Error("Step not found");

    const isStepAlreadyRunning = await Historical_run.exists({ runId, stepId });
    if (isStepAlreadyRunning) {
      console.log(`Step ${stepId} is already running.`);
      return null;
    }

    console.log("Executing step:", stepId);
    const input = await startStep(step, runId);

    const response = await executeStepType(step.type, stepId, userId, input, socket);

    await Historical_run.findOneAndUpdate(
      { runId, stepId },
      { $set: { result: response, completed: true } },
      { new: true, upsert: true }
    );

    return step.endingStep ? response : await executeNextSteps(step.nextSteps, runId, userId, socket);
  } catch (error) {
    console.error(`Failed to execute step: ${error.message}`);
    throw error;
  }
}

// Function to handle different step types
async function executeStepType(type, stepId, userId, input, socket) {
  switch (type) {
    case "llm": return executeStepLlm(stepId, userId, input, socket);
    case "document": return executeStepDocument(stepId, userId, socket);
    case "link": return executeStepLink(stepId, userId, socket);
    default: throw new Error("Step type not found");
  }
}

// Start a step and handle historical records
async function startStep(step, runId) {
  const historicalRecords = await Promise.all(step.previousSteps.map(
    previousStepId => checkHistoricalData(runId, previousStepId)
  ));

  await Historical_run.create({ runId, stepId: step._id, completed: false });
  return aggregateData(historicalRecords);
}

// Check historical data
async function checkHistoricalData(runId, stepId) {
  return Historical_run.findOne({ runId, stepId, completed: true }).exec();
}

// Aggregate data from previous steps
function aggregateData(inputs) {
  return inputs.filter(Boolean).join('; ');
}

// Execute next steps if current step is not the ending step
async function executeNextSteps(nextSteps, runId, userId, socket) {
  const nextStepPromises = nextSteps.map(async nextStepId => {
    const isNextStepRunning = await Historical_run.exists({ runId, stepId: nextStepId });
    if (!isNextStepRunning) {
      return executeStep(runId, nextStepId, userId, socket);
    }
  });

  return Promise.all(nextStepPromises.filter(Boolean));
}

export { executeStep };

