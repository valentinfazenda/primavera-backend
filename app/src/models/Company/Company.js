import mongoose from 'mongoose';

const CompanySchema = new mongoose.Schema({
    name: { type: String, required: true },
    creationDate: { type: Date, default: Date.now }
});

const Company = mongoose.model('Company', CompanySchema);

export default Company;
