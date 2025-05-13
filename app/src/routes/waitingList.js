import express from 'express';
const router = express.Router();
import WaitingList from '../models/WaitingList/WaitingList.js';

router.post('/join', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ field: 'email', msg: 'Email is required' });
    }

    try {
        const existingEntry = await WaitingList.findOne({ email });

        if (existingEntry) {
            return res.status(409).json({ field: 'email', msg: 'Email already in the waiting list' });
        }

        await new WaitingList({ email }).save();

        res.status(200).json({ msg: 'Successfully joined the waiting list' });
    } catch (err) {
        console.error("Error adding email to the waiting list:", err);
        res.status(500).json({ msg: 'Server error' });
    }
});

export default router;