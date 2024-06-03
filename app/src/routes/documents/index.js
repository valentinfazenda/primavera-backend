const express = require('express');
const router = express.Router();

const documentsRouter = require('./documents');

router.use('', documentsRouter);

module.exports = documentsRouter;