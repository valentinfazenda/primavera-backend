const mongoose = require('mongoose');
const Flow = require('../Flow/Flow');

const stepSchema = new mongoose.Schema({
  name: { type: String, required: true},
  flowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flow', required: true },
  type: { type: String, required: true },
  docSource: { type: String, required: false },
  docType: { type: String, required: false },
  modelLlm: { type: String, required: false },
  modelName: { type: String, required: false },
  previousStep: { type: mongoose.Schema.Types.ObjectId, ref: 'Step', required: false },
  nextStep: { type: mongoose.Schema.Types.ObjectId, ref: 'Step', required: false },
  startingStep: { type: Boolean, required: true, default: false },
  endingStep: { type: Boolean, required: true, default: false },
  data: { type: String, required: false }
});

module.exports = mongoose.model('Step', stepSchema);
