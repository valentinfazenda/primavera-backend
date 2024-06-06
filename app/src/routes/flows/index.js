import express from 'express';
const router = express.Router();

import stepsRouter from './steps/steps.js';
import runRouter from './run/run.js';
import flowsRouter from './flows.js';

router.use('/steps', stepsRouter);
router.use('/run', runRouter);
router.use('', flowsRouter);

export default router;