const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, default: Date.now },
    azureOpenAIDeploymentName: { type: String, required: false, unique: true},
    azureOpenAIApiKey: { type: String, required: true },
});

module.exports = mongoose.model('Company', CompanySchema);
