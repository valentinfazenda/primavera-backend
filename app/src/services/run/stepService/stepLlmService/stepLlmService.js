const axios = require('axios');
const Step = require('../../../../models/Step/Step');
const { sendMessageToAzureOpenAI } = require('../../../llms/azureOpenAIService/azureOpenAIService');
const { sendMessageToOpenAI } = require('../../../llms/openAIService/openAIService');

async function executeStepLlm(stepId, userId, input = '') {
  try {
    const step = await Step.findById(stepId);
    if (!step) {
      throw new Error("Step not found");
    }
    const messages = [];
    if (input != '') {
        messages.push({
            role: "user",
            content: input + "\n\n\nConsidering the above input the user wants to perform this task " + step.data + " Answer:"
        });
    } else {
        messages.push({
            role: "user",
            content: input + "\n\n\n" + step.data
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
    executeStepLlm,
};