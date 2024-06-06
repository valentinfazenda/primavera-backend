import mongoose from 'mongoose';

const flowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    required: false,
    default: 'true',
  },
  shared: {
    type: Boolean,
    required: false,
    default: 'false',
  },
  modified: {
    type: Date,
    required: false,
    default: Date.now,
  },
  runnedTimes: {
    type: Number,
    required: false,
    default: 0,
  },
});

const Flow = mongoose.model('Flow', flowSchema);

export default Flow;
