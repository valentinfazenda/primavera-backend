import mongoose from 'mongoose';
import Workspace from '../Workspace/Workspace.js';
import Model from '../Model/Model.js';
const { Schema } = mongoose;

const ChatSchema = new Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    creationDate: { type: Date, required: true, default: Date.now },
    modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Model', required: true },
});

const Chat = mongoose.model('Chat', ChatSchema);

export default Chat;
