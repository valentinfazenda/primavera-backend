const express = require('express');
const router = express.Router();

const modelsRouter = require('./models');

router.use('', modelsRouter);

module.exports = router;