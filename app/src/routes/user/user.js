import express from 'express';
const router = express.Router();
import { authenticateToken } from '../../middlewares/auth.js';
import User from '../../models/User/User.js';
import bcrypt from 'bcryptjs';
router.patch('/update', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    const { firstName, lastName, email, password, profilePicture, companyId } = req.body;

    // Build the update object dynamically based on the provided fields
    const update = {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(profilePicture && { profilePicture }),
        ...(companyId && { companyId })
    };

    // If a new password is provided, hash it
    if (password) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        update.password = hashedPassword;
    }

    try {
        // Find the user by ID and update, returning the updated user without the password field
        const updatedUser = await User.findByIdAndUpdate(userId, update, { new: true }).select('-password').orFail();
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating user:', error);
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

// Create a new user
router.post('/add', authenticateToken, async (req, res) => {
    const { firstName, lastName, email, password, profilePicture, companyId } = req.body;

    // Validate that all required fields are present
    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({ error: "All required fields (firstName, lastName, email, password) must be provided" });
    }

    try {
        // Check if a user with the same email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Email already in use" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user object
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            profilePicture,
            companyId,
        });

        // Save the new user to the database
        const savedUser = await newUser.save();
        res.status(201).json({ message: "User created successfully", user: savedUser });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
