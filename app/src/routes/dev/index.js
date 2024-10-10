import express from 'express';
const router = express.Router();
import { authenticateToken } from '../../middlewares/auth.js';
import { splitDocumentToChunks } from '../../services/indexing/splitter/splitterService.js';
import { embedDocumentChunks } from '../../services/indexing/embedder/embederService.js';
import { searchService } from '../../services/search/searchService.js';
import { executeMessage } from '../../services/chat/chatService.js';

router.post('/split', authenticateToken, async (req, res) => {
        splitDocumentToChunks("66601b5ab65917d969a4017f");
        res.status(200).json({ message: 'Document split successfully' });
});

router.post('/embeder', authenticateToken, async (req, res) => {
    await embedDocumentChunks("66e32a741d1b03dafa978b10");
    res.status(200).json({ message: 'Document embedded successfully' });
});

router.post('/search', authenticateToken, async (req, res) => {
    const result = await searchService("Quand la société bénéficiaire clôt son exercice social");
    res.status(200).json({ message: result });
});

router.post('/message', authenticateToken, async (req, res) => {
    const {chatId, message} = req.body;

    const result = await executeMessage(message, chatId, req.user.id);
    res.status(200).json({ message: result });
});

export default router;