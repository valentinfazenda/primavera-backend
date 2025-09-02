import User from '../models/User/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
    const { firstName, lastName, email, password, lastname, APIKey, company } = req.body;

    const validProps = ['firstName', 'lastName', 'email', 'password', 'APIKey', 'company'];
    const requestProps = Object.keys(req.body);
    const invalidProps = requestProps.filter(prop => !validProps.includes(prop));

    if (invalidProps.length > 0) {
        return res.status(400).json({ msg: `Invalid properties found: ${invalidProps.join(', ')}` });
    }

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({ firstName, lastName, email, password, APIKey, company });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

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

export async function session(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("_id email firstName lastName profilePicture status")
      .lean();
    if (!user) return res.status(404).json({ ok: false, error: "User not found" });

    return res.status(200).json({ ok: true, user });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}
