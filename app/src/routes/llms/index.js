import express from 'express';
const router = express.Router();

import openAIRouter from './openAI/openAI.js';
import azureOpenAIRouter from './azureOpenAI/azureOpenAI.js';

router.use('/openai', openAIRouter);
router.use('/azureopenai', azureOpenAIRouter);

export default router;