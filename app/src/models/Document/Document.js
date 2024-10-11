import Workspace from '../Workspace/Workspace.js';
import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({

  workspaceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Workspace', 
    required: true },
  name: {
    type: String,
    required: true
  },
  fulltext: {
    type: String,
    required: false
  },
  status: { 
    type: String, 
    required: true, 
    default: 'unknown' },
  creationDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
});

DocumentSchema.index({ fulltext: 'text' });

const Document = mongoose.model('Document', DocumentSchema);

export default Document;
