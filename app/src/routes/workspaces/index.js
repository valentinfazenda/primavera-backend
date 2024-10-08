import express from 'express';
const router = express.Router();

import documentsRouter from './documents.js';

router.use('', documentsRouter);

export default documentsRouter;