import mongoose from 'mongoose';

const modelSchema = new mongoose.Schema({
  name: {type: String, required: true},
  userId: {type: String, required: true},
  apiKey: {type: String, required: true},
  activation: {type: Number, required: true, default: 0},
  active : {type: Boolean, required: false, default: true},
});

const Model = mongoose.model('Model', modelSchema);

export default Model;