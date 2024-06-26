import express from 'express';
const router = express.Router();
import { authenticateToken } from '../../../middlewares/auth.js';
import uploadImage from '../../../middlewares/upload.js';
import User from '../../../models/User/User.js';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3 from '../../../config/aws.js';

const deleteImageFromS3 = async (imageUrl) => {
    if (!imageUrl) return;

    const key = imageUrl.split('/').slice(3).join('/');
    const deleteParams = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key
    };

    try {
        const s3Client = new S3Client({ region: process.env.AWS_REGION });
        await s3Client.send(new DeleteObjectCommand(deleteParams));
        console.log(`Deleted old image from S3: ${key}`);
    } catch (err) {
        console.error(`Error deleting old image from S3: ${err.message}`);
    }
};

router.post('', authenticateToken, uploadImage.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            console.error("File is required but not found");
            return res.status(400).json({ error: "File is required" });
        }

        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            console.error("User not found");
            return res.status(404).json({ error: "User not found" });
        }

        const oldProfilePictureUrl = user.profilePicture;
        const newProfilePictureUrl = req.file.location;

        if (oldProfilePictureUrl) {
            await deleteImageFromS3(oldProfilePictureUrl);
        }

        user.profilePicture = newProfilePictureUrl;
        await user.save();

        res.status(200).json({ profilePicture: user.profilePicture });
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
