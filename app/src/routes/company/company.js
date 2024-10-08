import express from 'express';
const router = express.Router();
import { authenticateToken } from '../../middlewares/auth.js';
import Company from '../../models/Company/Company.js';


router.post('/add', authenticateToken, async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: "Company name is required" });
    }

    try {
        const newCompany = new Company({ name });
        const savedCompany = await newCompany.save();
        res.status(201).json(savedCompany);
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ error: error.message });
    }
});


router.delete('/delete', authenticateToken, async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Company ID is required" });
    }

    if (req.user.status !== 'admin') {
        return res.status(403).json({ error: "Unauthorized access. Only admins can delete companies." });
    }

    try {
        const deletedCompany = await Company.findByIdAndDelete(id);
        if (!deletedCompany) {
            return res.status(404).json({ error: "Company not found" });
        }
        res.status(200).json({ message: "Company deleted successfully" });
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ error: error.message });
    }
});



router.post('/details', authenticateToken, async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ error: "Company ID is required" });
    }

    try {
        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }
        res.status(200).json(company);
    } catch (error) {
        console.error('Error finding company:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
