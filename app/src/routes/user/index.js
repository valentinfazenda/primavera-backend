import express from 'express';
const router = express.Router();

import uploadImageRouter from './uploadImage/uploadImage.js';
import userRouter from './user.js';

router.use('/upload-profile-picture', uploadImageRouter);
router.use('', userRouter);

export default router;