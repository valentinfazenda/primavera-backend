const express = require('express');
const bodyParser = require('body-parser');
const tradeRoute = require('./app/src/routes/trade');
const trainRoute = require('./app/src/routes/train');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use('/', tradeRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
