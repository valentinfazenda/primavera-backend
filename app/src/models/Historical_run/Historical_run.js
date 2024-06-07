import mongoose from 'mongoose';

const historicalRunSchema = new mongoose.Schema({
  runId: { type: String, required: true },
  stepId: { type: mongoose.Schema.Types.ObjectId, ref: 'Step', required: true },
  result: { type: String, required: false },
  completed: { type: Boolean, required: true, default: false }
});

const HistoricalRun = mongoose.model('historicalRun', historicalRunSchema);

export default HistoricalRun;