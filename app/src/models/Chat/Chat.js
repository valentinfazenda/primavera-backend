import mongoose from 'mongoose';
import Workspace from '../Workspace/Workspace.js';
const { Schema } = mongoose;

const ChatSchema = new Schema({
    workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workspace', required: true },
    creationDate: { type: Date, required: true, default: Date.now },
});

const Chat = mongoose.model('Chat', ChatSchema);

export default Chat;
