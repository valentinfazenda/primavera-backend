const express = require('express');
const trainRoute = require('./app/routes/train');

const app = express();

app.use(express.json());
app.use('/', trainRoute);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
