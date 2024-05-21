const axios = require('axios');
const { Symbol, HistoricalData } = require('../models/Data_Crypto');

const downloadCryptoData = async (symbol) => {
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=1d&limit=1000`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(`Exception Caught for symbol ${symbol}! Message: ${error.message}`);
    return null;
  }
};

const download_crypto_data = async () => {
  try {
    const symbols = await Symbol.find({});
    const bulkOperations = [];

    for (const symbolDoc of symbols) {
      const symbol = symbolDoc.name;
      console.log(`Downloading data for ${symbol}`);
      if (symbol) {
        const data = await downloadCryptoData(symbol);
        if (data) {
          data.forEach(item => {
            const [openTime, open, high, low, close] = item;
            const date = new Date(openTime).toISOString().split('T')[0];
            bulkOperations.push({
              insertOne: {
                document: {
                  name: symbol,
                  date,
                  open,
                  high,
                  low,
                  close
                }
              }
            });
          });
        }
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      }
    }

    if (bulkOperations.length > 0) {
      await HistoricalData.bulkWrite(bulkOperations);
      console.log('All data downloaded and saved to MongoDB.');
    } else {
      console.log('No data to save.');
    }
  } catch (error) {
    console.error(`Error fetching symbols from database: ${error.message}`);
  }
};

module.exports = {
  download_crypto_data
};
