import mongoose from 'mongoose';
import Flow from '../Flow/Flow.js';

const stepSchema = new mongoose.Schema({
  name: { type: String, required: true},
  flowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flow', required: true },
  type: { type: String, required: true },
  documentId: { type: String, required: false },
  modelLlm: { type: String, required: false },
  modelName: { type: String, required: false },
  previousSteps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Step', required: false }],
  nextSteps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Step', required: false }],
  startingStep: { type: Boolean, required: true, default: false },
  endingStep: { type: Boolean, required: true, default: false },
  data: { type: String, required: false }
});

const Step = mongoose.model('Step', stepSchema);

export default Step;
