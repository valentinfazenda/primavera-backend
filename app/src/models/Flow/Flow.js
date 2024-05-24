const mongoose = require('mongoose');

const flowSchema = new mongoose.Schema({
  userid: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  
  data: {
    type: String,
    required: true,
  }
});

const Flow = mongoose.model('Flow', flowSchema);

module.exports = Flow;
