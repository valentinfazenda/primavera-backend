const mongoose = require('mongoose');

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
  }
});

DocumentSchema.index({ fulltext: 'text' });

const Document = mongoose.model('Document', DocumentSchema);

module.exports = Document;
