const { Spot } = require('@binance/connector');
require('dotenv').config();

const apiKey = process.env.BINANCE_API_KEY;
const apiSecret = process.env.BINANCE_API_SECRET;

const client = new Spot(apiKey, apiSecret);

async function createOrder(symbol, side, order_type, quantity, price) {
  const timestamp = Date.now();
  try {
    const response = await client.newOrder(symbol, side, order_type, {
      price: price,
      quantity: quantity,
      timeInForce: 'GTC',
      timestamp: timestamp
    });
    client.logger.log(response.data);
    return response.data;
  } catch (error) {
    client.logger.error('Error creating order:', error.message);
    if (error.response) {
      client.logger.error('Response data:', error.response.data);
      client.logger.error('Response status:', error.response.status);
      client.logger.error('Response headers:', error.response.headers);
      throw new Error(error.response.data.msg);
    }
  }
}

module.exports = { createOrder };
