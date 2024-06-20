import mongoose from 'mongoose';
const { Schema } = mongoose;

const flowSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  status: {
    type: Boolean,
    required: false,
    default: 'true',
  },
  ownerType: { 
    type: String, 
    required: true, 
    enum: ['company', 'user'] 
  },
  ownerId: { 
    type: Schema.Types.ObjectId, 
    required: true,
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
