const express = require('express');
const router = express.Router();

const uploadImageRouter = require('./uploadImage/uploadImage');
const userRouter = require('./user');

router.use('/upload-profile-picture', uploadImageRouter);
router.use('', userRouter);

module.exports = router;