const express = require('express');
const connectDB = require('./app/src/config/db');
const bodyParser = require('body-parser');

const llmsRoute = require('./app/src/routes/llms');
const flowsRoute = require('./app/src/routes/flows');
const modelsRoute = require('./app/src/routes/models');
const userRoute = require('./app/src/routes/user');
const authRoute = require('./app/src/routes/auth');
const waitingListRoute = require('./app/src/routes/waitingList');

const authenticateToken = require('./app/src/middlewares/auth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

connectDB();

app.use(bodyParser.json());

// Public routes
app.use('/api/auth', authRoute);
app.use('/api/waitingList', waitingListRoute);

// Protected routes
app.use('/api/flows/', authenticateToken, flowsRoute);
app.use('/api/llms/', authenticateToken, llmsRoute);
app.use('/api/user/', authenticateToken, userRoute);
app.use('/api/models/', authenticateToken, modelsRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
