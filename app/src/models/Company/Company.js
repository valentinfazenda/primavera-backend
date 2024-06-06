import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: Date, default: Date.now },
    azureOpenAIDeploymentName: { type: String, required: false, unique: true},
    azureOpenAIApiKey: { type: String, required: true },
});

const Company = mongoose.model('Company', CompanySchema);

export default Company;
