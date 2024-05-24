const Flow = require('../../../models/Flow/Flow');

async function executeFlow(flowId) {
  try {
    const flow = await Flow.findById(flowId);

    if (!flow) {
      throw new Error("Flow not found");
    }

    const steps = flow.steps;
    const results = [];

    for (const step of steps) {
      const result = await executeStep(step);
      results.push(result);
    }

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
