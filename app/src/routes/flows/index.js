const express = require('express');
const router = express.Router();

const stepsRouter = require('./steps/steps');
const runRouter = require('./run/run');
const flowsRouter = require('./flows');

router.use('/steps', stepsRouter);
router.use('/run', runRouter);
router.use('', flowsRouter);

module.exports = router;