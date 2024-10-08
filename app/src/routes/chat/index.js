import express from 'express';
const router = express.Router();

import chatRouter from './chat.js';

router.use('', chatRouter);

export default chatRouter;