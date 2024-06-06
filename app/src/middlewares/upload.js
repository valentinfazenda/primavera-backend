import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import s3 from '../config/aws.js';
import path from 'path';

const uploadImage = multer({
    storage: multerS3({
        s3: s3,
        bucket: process.env.AWS_BUCKET_NAME,
        key: function (req, file, cb) {
            cb(null, `profile-pictures/${Date.now().toString()}${path.extname(file.originalname)}`);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const filetypes = /jpeg|jpg|png/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Error: File upload only supports the following filetypes - " + filetypes));
    }
});

export default uploadImage;
