const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middlewares/auth');
const User = require('../../models/User/User');

router.post('/update', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { column, value } = req.body;

        if (!column || value === undefined) {
            return res.status(400).json({ error: "Properties 'column' and 'value' are required." });
        }

        const update = { [column]: value };

        const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found." });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
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

module.exports = router;
