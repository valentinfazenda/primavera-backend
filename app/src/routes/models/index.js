import express from 'express';
const router = express.Router();

import modelsRouter from './models.js';

router.use('', modelsRouter);

export default router;