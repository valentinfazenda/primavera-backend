const express = require('express');
const connectDB = require('./app/src/config/db');
const bodyParser = require('body-parser');
const tradeRoute = require('./app/src/routes/trade');
const dataRoute = require('./app/src/routes/data');
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
app.use('/api/data', authenticateToken, dataRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
