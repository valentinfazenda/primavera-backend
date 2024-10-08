import mongoose from 'mongoose';
import User from '../User/User.js';
const { Schema } = mongoose;

const WorkspaceSchema = new Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    creationDate: { type: Date, required: true, default: Date.now },
});

const Workspace = mongoose.model('Workspace', WorkspaceSchema);

export default Workspace;
