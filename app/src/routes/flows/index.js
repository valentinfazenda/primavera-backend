const express = require('express');
const router = express.Router();

const stepsRouter = require('./steps/steps');
const flowsRouter = require('./flows');

router.use('/steps', stepsRouter);
router.use('', flowsRouter);

module.exports = router;