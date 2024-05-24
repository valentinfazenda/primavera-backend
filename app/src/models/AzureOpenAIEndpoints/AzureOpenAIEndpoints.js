const mongoose = require('mongoose');

const AzureOpenAIDeploymentSchema = new mongoose.Schema({
    enpoint: { type: String, required: true },
    deploymentName: { type: String, required: true },
    company: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AzureOpenAIEndpoints', AzureOpenAIDeploymentSchema);
