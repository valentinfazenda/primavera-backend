import User from '../models/User/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Company from '../models/Company/Company.js';

export const register = async (req, res) => {
    const { firstName, lastName, email, password, companyId } = req.body;

    // Validate that all required fields are present
    if (!firstName || !lastName || !email || !password || !companyId) {
        return res.status(400).json({ error: "All required fields (firstName, lastName, email, password, companyId) must be provided" });
    }

    try {

        // Check if the companyId is provided and if the company exists
        if (companyId) {
            const company = await Company.findById(companyId);
            if (!company) {
                return res.status(404).json({ error: "Company not found" });
            }
        }

        // Check if a user with the same email already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ error: "Email already in use" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create a new user object
        user = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            companyId,
        });
        await user.save();

        // Create a JWT payload and sign the token
        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token }); // Return the token for authentication
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: "Server error" });
    }
};


export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        const payload = { user: { id: user.id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 360000 }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

export const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};
