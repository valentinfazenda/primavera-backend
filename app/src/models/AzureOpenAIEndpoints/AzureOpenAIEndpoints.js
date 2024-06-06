import mongoose from 'mongoose';

const AzureOpenAIDeploymentSchema = new mongoose.Schema({
    enpoint: { type: String, required: true },
    deploymentName: { type: String, required: true },
    company: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const AzureOpenAIEndpoints = mongoose.model('AzureOpenAIEndpoints', AzureOpenAIDeploymentSchema);

export default Company;
