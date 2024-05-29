const express = require('express');
const router = express.Router();
const authenticateToken = require('../../middlewares/auth');
const { DocumentOCR } = require('../../services/documents/pdf/ocrService/ocrService');

router.post('/pdfOCR', authenticateToken, async (req, res) => {
    try {
        const { url } = req.body;
        if (!url) {
            return res.status(400).json({ error: "Property URL is missing" });
        }

        const pdfContent = await DocumentOCR(url);
        res.status(200).json({ content: pdfContent });
    } catch (error) {
        console.error(error);
        if (error.response) {
            res.status(error.response.status).json({ error: error.response.data });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
});

module.exports = router;