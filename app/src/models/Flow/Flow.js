const mongoose = require('mongoose');

const flowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
});

const Flow = mongoose.model('Flow', flowSchema);

module.exports = Flow;
