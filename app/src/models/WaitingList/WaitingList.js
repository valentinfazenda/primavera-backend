// models/WaitingList.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

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

const WaitingList = mongoose.model('WaitingList', WaitingListSchema);

export default WaitingList;