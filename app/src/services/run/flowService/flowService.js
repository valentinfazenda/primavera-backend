const Flow = require('../../../models/Flow/Flow');
const Step = require('../../../models/Step/Step');
const { executeStep } = require('../stepService/stepService');

async function executeFlow(flowId, userId, socket) {
  try {
    const flow = await Flow.findById(flowId);
    if (!flow) {
      throw new Error("Flow not found");
    }

    // Fetching steps that belong to this flow and are starting steps
    const startingSteps = await Step.find({ flowId: flowId, startingStep: true });
    
    if (!startingSteps.length) {
      throw new Error("No starting steps found for this flow");
    }

    let results;

    if (socket) { 
      results = await Promise.all(startingSteps.map(step => executeStep(step._id, userId, '', socket)));
    } else {
      results = await Promise.all(startingSteps.map(step => executeStep(step._id, userId)));
    }

    return { success: true, results };
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
}

module.exports = {
  executeFlow
};
