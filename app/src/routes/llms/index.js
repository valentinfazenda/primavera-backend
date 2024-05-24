const express = require('express');
const router = express.Router();

const openAIRouter = require('./openAI/openAI');
const azureOpenAIRouter = require('./azureOpenAI/azureOpenAI');

router.use('/openai', openAIRouter);
router.use('/azureopenai', azureOpenAIRouter);

module.exports = router;