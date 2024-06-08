import Step from '../../../../models/Step/Step.js';
import Historical_run from '../../../../models/Historical_run/Historical_run.js';
import { sendMessageToAzureOpenAI } from '../../../llms/azureOpenAIService/azureOpenAIService.js';
import { sendMessageToOpenAI } from '../../../llms/openAIService/openAIService.js';


async function executeStepIf(stepId, userId, runId, socket = null) {
  try {
    const step = await Step.findById(stepId).orFail(new Error("Step not found"));
    const historicalRecords = await Promise.all(step.previousSteps.map(
      previousStepId => checkHistoricalData(runId, previousStepId)
    ));
    const input = aggregateData(historicalRecords);

    const messages = [{
        role: "user",
        content: `${input}\n\n\n${input ? `Considering the above input the user wants to find if the statement ${step.data} is true or false about the input. Give an answer 'true' or 'false', just the asnwer, one word, nothing else. Answer:` : step.data}`
    }];
    let response = null;
    switch (step.modelLlm) {
        case "AzureOpenAI":
            response = await sendMessageToAzureOpenAI(userId, messages, step.modelName, stepId, socket);
            break;
        case "OpenAI":
            response = await sendMessageToOpenAI(userId, messages, step.modelName, stepId, socket);
            break;
        default:
            throw new Error("Model not found");
    }
    console.log("Response:", response);
    return response === 'true' ? input : null;

  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Check and return historical data if completed
async function checkHistoricalData(runId, stepId) {
  console.log("Checking historical data for step:", stepId);
  console.log("RunId:", runId);
  return Historical_run.findOne({ runId, stepId, completed: true }).exec();
}

// Combine data from completed previous steps
function aggregateData(inputs) {
  return inputs.filter(Boolean).map(input => input.result).join('; ');
}

export {
  executeStepIf,
};