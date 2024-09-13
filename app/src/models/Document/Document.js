import mongoose from 'mongoose';

const DocumentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  fulltext: {
    type: String,
    required: false
  },
  extension: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  chunks: [{
    type: String
  }],
  embededChunks: [{
    type: String
  }]
  
});

DocumentSchema.index({ fulltext: 'text' });

const Document = mongoose.model('Document', DocumentSchema);

export default Document;
