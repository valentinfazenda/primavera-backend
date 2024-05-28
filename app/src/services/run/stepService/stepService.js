const axios = require('axios');
const Step = require('../../../models/Step'); // Ajustez le chemin selon votre structure

async function executeStep(stepId, input = '') {
  try {
    const step = await Step.findById(stepId);
    if (!step) {
      throw new Error("Step not found");
    }

    const dataToSend = {
      input: input,
      stepData: step.data
    };

    const response = await axios.post('http://localhost:3000/api/llms/azureopenai', dataToSend);
    
    if (step.endingStep) {
      return response.data;
    } else {
      if (!step.nextStepId) {
        throw new Error("No next step defined");
      }
      return await executeStep(step.nextStepId, response.data);
    }
  } catch (error) {
    console.error(error);
    throw new Error("Failed to execute step: " + error.message);
  }
}

module.exports = {
  executeStep,
};
