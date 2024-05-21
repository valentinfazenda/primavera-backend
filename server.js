const express = require('express');
const connectDB = require('./app/src/config/db');
const bodyParser = require('body-parser');
const tradeRoute = require('./app/src/routes/trade');
const trainRoute = require('./app/src/routes/train');
const authRoute = require('./app/src/routes/auth');
const authenticateToken = require('./app/src/middlewares/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(bodyParser.json());

// Public routes
app.use('/api/auth', authRoute);

// Protected routes
app.use('/api/trade', authenticateToken, tradeRoute);
app.use('/api/train', authenticateToken, trainRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
