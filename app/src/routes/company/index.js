import express from 'express';
const router = express.Router();

import companyRouter from './company.js';

router.use('', companyRouter);

export default companyRouter;