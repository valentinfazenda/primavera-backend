import mongoose from 'mongoose';
const { Schema } = mongoose;

const modelSchema = new Schema({
  name: { type: String, required: true },
  provider: { type: String, required: false },
  ownerType: { 
    type: String, 
    required: true, 
    enum: ['company', 'user'] 
  },
  provider:"string",
  ownerId: { 
    type: Schema.Types.ObjectId, 
    required: true,
  },
  tokenLength: { type: Number, required: true, default: 128000},
  apiKey: { type: String, required: true },
  activation: { type: Number, required: true, default: 0 },
  active: { type: Boolean, required: false, default: true },
});

const Model = mongoose.model('Model', modelSchema);

export default Model;