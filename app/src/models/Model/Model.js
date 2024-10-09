import mongoose from 'mongoose';
import Company from '../Company/Company.js';

const { Schema } = mongoose;

const modelSchema = new Schema({
  name: { type: String, required: true },
  companyId: { 
    type: Schema.Types.ObjectId, 
    required: true,
    ref: 'Company'
  },
  azureOpenAIDeploymentName: { type: String, required: true },
  modelDeploymentName: { type: String, required: true },
  apiKey: { type: String, required: true },
  apiVersion: { type: String, required: false },
  tokenLength: { type: Number, required: true, default: 128000},
});

const Model = mongoose.model('Model', modelSchema);

export default Model;