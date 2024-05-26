const Flow = require('../../../models/Flow/Flow');

async function executeFlow(flowId) {
  try {
    const flow = await Flow.findById(flowId);

    if (!flow) {
      throw new Error("Flow not found");
    }
    const startingSteps = flow.steps.filter(step => step.startingStep);

    const results = await Promise.all(startingSteps.map(step => executeStep(step)));

    return { success: true, results };
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
}

async function executeStep(step) {
  return `Executed step ${step}`;
}

module.exports = {
  executeFlow,
};
