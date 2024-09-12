import express from 'express';
const router = express.Router();
import { authenticateToken } from '../../middlewares/auth.js';
import { splitDocumentToChunks } from '../../services/indexing/splitter/splitterService.js';

router.post('/split', authenticateToken, async (req, res) => {
        splitDocumentToChunks("testValue");
        res.status(200).json({ message: 'Document split successfully' });
});

export default router;