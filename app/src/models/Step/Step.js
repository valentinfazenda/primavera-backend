const mongoose = require('mongoose');
const Flow = require('../Flow/Flow');
const { urlencoded } = require('body-parser');

const stepSchema = new mongoose.Schema({
  name: { type: String, required: true},
  flowId: { type: mongoose.Schema.Types.ObjectId, ref: 'Flow', required: true },
  type: { type: String, required: true },
  docSource: { type: String, required: false },
  docType: { type: String, required: false },
  modelLlm: { type: String, required: false },
  modelName: { type: String, required: false },
  previousSteps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Step', required: false }],
  nextSteps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Step', required: false }],
  startingStep: { type: Boolean, required: true, default: false },
  endingStep: { type: Boolean, required: true, default: false },
  data: { type: String, required: false }
});

module.exports = mongoose.model('Step', stepSchema);
