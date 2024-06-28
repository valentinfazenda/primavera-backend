import mongoose from 'mongoose';
const { Schema } = mongoose;

const AzureOpenAIDeploymentSchema = new Schema({
    modelId: { 
        type: Schema.Types.ObjectId, 
        required: true,
        unique: true,
        ref: 'Model'
    },
    azureOpenAIDeploymentName: { type: String, required: true },
    modelDeploymentName: { type: String, required: true },
    modelApiKey: { type: String, required: true }
});

const AzureOpenAIEndpoint = mongoose.model('AzureOpenAIEndpoint', AzureOpenAIDeploymentSchema);

export default AzureOpenAIEndpoint;
