import mongoose from 'mongoose';
const { Schema } = mongoose;

const WorkspaceSchema = new Schema({
    //user
    


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

const Workspace = mongoose.model('Workspace', WorkspaceSchema);

export default Workspace;
