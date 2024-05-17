const express = require('express');
const { createOrder } = require('../services/order_service');
const { validateOrderData } = require('../utils/helpers');

const router = express.Router();

router.post('/api/heroku/trade/binance', async (req, res) => {
  const data = req.body;

  try {
    validateOrderData(data);

    const { symbol, side, order_type, quantity, price } = data;

    const order = await createOrder(symbol, side, order_type, quantity, price);
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
