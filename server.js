const express = require('express');
const connectDB = require('./app/src/config/db');
const bodyParser = require('body-parser');

const llmsRoute = require('./app/src/routes/llms/openAI/openAI');
const flowsRoute = require('./app/src/routes/flows/flows');
const userRoute = require('./app/src/routes/user/user');
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
app.use('/api/flows', authenticateToken, flowsRoute);
app.use('/api/llms', authenticateToken, llmsRoute);
app.use('/api/user', authenticateToken, userRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
