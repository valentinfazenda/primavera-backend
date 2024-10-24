import express from 'express';
const router = express.Router();

import azureOpenAIRouter from './azureOpenAI/azureOpenAI.js';

router.use('/azureopenai', azureOpenAIRouter);

export default router;