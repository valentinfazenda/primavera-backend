import express from 'express';
const router = express.Router();

import workspacesRouter from './workspaces.js';

router.use('', workspacesRouter);

export default workspacesRouter;