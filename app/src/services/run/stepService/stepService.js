import axios from 'axios';
import Step from '../../../models/Step/Step.js';
import Historical_run from '../../../models/Historical_run/Historical_run.js';
import { executeStepLlm } from './stepLlmService/stepLlmService.js';
import { executeStepDocument } from './stepDocumentService/stepDocumentService.js';
import { executeStepLink } from './stepLinkService/stepLinkService.js';
import { executeStepIf } from './stepIfService/stepIfService.js';

// Utility to create or update historical records
async function updateHistoricalRecord(runId, stepId, result = null, completed = false) {
  const update = { runId, stepId, completed };
  if (result) update.result = result;
  return Historical_run.findOneAndUpdate(
    { runId, stepId },
    { $set: update },
    { new: true, upsert: true }
  );
}

// Main function to execute a step
async function executeStep(runId, stepId, userId, socket = null) {
  try {
    const step = await Step.findById(stepId);
    if (!step) throw new Error("Step not found");

    await updateHistoricalRecord(runId, step._id);

    console.log("Executing step:", stepId);
    const historicalRecords = await Promise.all(step.previousSteps.map(
      previousStepId => checkHistoricalData(runId, previousStepId)
    ));
  
    const input = aggregateData(historicalRecords);
    const response = await executeStepType(step.type, stepId, userId, runId, input, socket);

    await updateHistoricalRecord(runId, step._id, response, true);
    if (response == null){
      return null;
    }
    return step.endingStep ? response : await executeNextSteps(step.nextSteps, runId, userId, socket);
  } catch (error) {
    console.error(`Failed to execute step: ${error.message}`);
    throw error;
  }
}

// Handler for different step types
async function executeStepType(type, stepId, userId, runId, input, socket) {
  const handlers = {
    llm: () => executeStepLlm(stepId, userId, input, socket),
    document: () => executeStepDocument(stepId, userId, socket),
    link: () => executeStepLink(stepId, userId, socket),
    if:() => executeStepIf(stepId, userId, runId, socket)
  };
  const handler = handlers[type];
  if (!handler) throw new Error("Step type not found");
  return handler();
}

// Check and return historical data if completed
async function checkHistoricalData(runId, stepId) {
  return Historical_run.findOne({ runId, stepId, completed: true }).exec();
}

// Combine data from completed previous steps
function aggregateData(inputs) {
  return inputs.filter(Boolean).map(input => input.result).join('; ');
}

// Recursive execution of next steps
async function executeNextSteps(nextSteps, runId, userId, socket) {
  const results = await Promise.all(nextSteps.map(async (nextStepId) => {
    const isNextStepRunning = await Historical_run.exists({ runId, stepId: nextStepId });
    return !isNextStepRunning ? executeStep(runId, nextStepId, userId, socket) : null;
  }));
  return results.filter(Boolean);
}

export { executeStep };