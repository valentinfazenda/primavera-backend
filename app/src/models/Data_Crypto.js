const mongoose = require('mongoose');

const symbolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

const historicalDataSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  open: {
    type: String,
    required: true,
  },
  high: {
    type: String,
    required: true,
  },
  low: {
    type: String,
    required: true,
  },
  close: {
    type: String,
    required: true,
  },
});

const Symbol = mongoose.model('Symbol', symbolSchema);
const HistoricalData = mongoose.model('HistoricalData', historicalDataSchema);

module.exports = {
  Symbol,
  HistoricalData,
};
