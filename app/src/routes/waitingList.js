import express from 'express';
const router = express.Router();
import WaitingList from '../models/WaitingList/WaitingList.js';

router.post('/join', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const existingEntry = await WaitingList.findOne({ email });

        if (existingEntry) {
            return res.status(400).json({ error: 'Email is already in the waiting list' });
        }

        const newEntry = new WaitingList({ email });
        await newEntry.save();

        res.status(200).json({ message: 'Email added to the waiting list successfully' });
    } catch (error) {
        console.error("Error adding email to the waiting list:", error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
