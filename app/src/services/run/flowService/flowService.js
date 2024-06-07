import Flow from '../../../models/Flow/Flow.js';
import Step from '../../../models/Step/Step.js';
import { v4 as uuidv4 } from 'uuid';
import { executeStep } from '../stepService/stepService.js';

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
    const runId = uuidv4();
    let results;
    if (socket) { 
      results = await Promise.all(startingSteps.map(step => executeStep(runId, step._id, userId, '', socket)));
    } else {
      results = await Promise.all(startingSteps.map(step => executeStep(runId, step._id, userId)));
    }
    results = results.filter(result => result.length > 0)
    return { success: true, results };
  } catch (error) {
    console.error(error);
    throw new Error(error.message);
  }
}

export default executeFlow;
