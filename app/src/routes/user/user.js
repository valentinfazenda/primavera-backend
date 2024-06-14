import express from 'express';
const router = express.Router();
import { authenticateToken } from '../../middlewares/auth.js';
import User from '../../models/User/User.js';

router.patch('/update', authenticateToken, async (req, res) => {
        const userId = req.user.id;
        const { firstName, lastName, email, password, profilePicture, company } = req.body;
        const update = { ...(firstName && { firstName }), ...(lastName && { lastName }), ...(email && { email }), ...(password && { password }), ...(profilePicture && { profilePicture }), ...(company && { company }) };
        try {
            const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true }).orFail();
            res.status(200).json(updatedUser);
          } catch (error) {
            console.error(error);
            // Differentiate between not found and other server errors
            res.status(error.name === 'DocumentNotFoundError' ? 404 : 500).json({ error: error.message });
          }
        });

router.get('/details', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
