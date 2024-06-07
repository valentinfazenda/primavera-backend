import express from 'express';
const router = express.Router();

import linksRouter from './links.js';

router.use('', linksRouter);

export default linksRouter;