// app/services/order_service.js

const axios = require('axios');
require('dotenv').config();

const BINANCE_API_KEY = process.env.BINANCE_API_KEY;
const BINANCE_API_SECRET = process.env.BINANCE_API_SECRET;

async function createOrder(symbol, side, order_type, quantity, price) {
  const url = 'https://api.binance.com/api/v3/order';
  const data = {
    symbol,
    side,
    type: order_type,
    quantity
  };

  if (order_type === 'LIMIT') {
    data.price = price;
    data.timeInForce = 'GTC';
  }

  try {
    const response = await axios.post(url, data, {
      headers: {
        'X-MBX-APIKEY': BINANCE_API_KEY
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response.data.msg);
  }
}

module.exports = { createOrder };