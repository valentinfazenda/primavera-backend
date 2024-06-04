const axios = require('axios');
const Step = require('../../../../models/Step/Step');
const { sendMessageToAzureOpenAI } = require('../../../llms/azureOpenAIService/azureOpenAIService');
const { sendMessageToOpenAI } = require('../../../llms/openAIService/openAIService');

async function executeStepLlm(stepId, userId, input = '', socket = null) {
  try {
    const step = await Step.findById(stepId).orFail(new Error("Step not found"));
    const messages = [{
        role: "user",
        content: `${input}\n\n\n${input ? `Considering the above input the user wants to perform this task ${step.data} Answer:` : step.data}`
    }];
    switch (step.modelLlm) {
        case "AzureOpenAI":
            return await sendMessageToAzureOpenAI(userId, messages, step.modelName, stepId, socket);
        case "OpenAI":
            return await sendMessageToOpenAI(userId, messages, step.modelName, stepId, socket);
        default:
            throw new Error("Model not found");
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

module.exports = {
    executeStepLlm,
};