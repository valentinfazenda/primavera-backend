import express from 'express';
const router = express.Router();

import workspacesRouter from './documents.js';

router.use('', workspacesRouter);

export default workspacesRouter;