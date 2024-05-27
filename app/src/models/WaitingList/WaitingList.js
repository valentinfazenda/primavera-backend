// models/WaitingList.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WaitingListSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    match: [/.+\@.+\..+/, 'Please enter a valid email address']
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WaitingList', WaitingListSchema);