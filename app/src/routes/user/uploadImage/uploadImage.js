const express = require('express');
const router = express.Router();
const authenticateToken = require('../../../middlewares/auth');
const uploadImage = require('../../../middlewares/upload');
const User = require('../../../models/User/User');

router.post('', authenticateToken, uploadImage.single('profilePicture'), async (req, res) => {
    try {
        if (!req.file) {
            console.error("File is required but not found");
            return res.status(400).json({ error: "File is required" });
        }

        const userId = req.user.id;

        const profilePictureUrl = req.file.location;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { profilePicture: profilePictureUrl } },
            { new: true, upsert: true }
        );
        if (!user) {
            console.error("User not found");
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json({ profilePicture: user.profilePicture });
    } catch (error) {
        console.error("Error uploading profile picture:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
